from django.shortcuts import render
from django.http import JsonResponse
import json
from ai_pipeline.service import process_receipt
from .models import Expense, Item, Split, Group
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.shortcuts import get_object_or_404
import uuid
from django.db import transaction, models
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie



# Create your views here.

def get_authenticated_user(request):
    auth = JWTAuthentication()
    
    try:
        user_auth_tuple = auth.authenticate(request)
    except (InvalidToken, TokenError):
        return None

    if user_auth_tuple is None:
        return None
    
    user, _ = user_auth_tuple
    return user


@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})

@csrf_exempt
def upload_receipt(request):

    #Auth Check
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    if request.method == "POST":
        file = request.FILES.get("file")

        if not file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        
        ext = file.name.split(".")[-1].lower()

        if ext not in ["jpg", "jpeg", "png", "pdf", "heic"]:
            return JsonResponse({"error": "Unsupported file extension"}, status=400)
        
        try:
            file_name = f"receipts/{uuid.uuid4()}_{file.name}"
            saved_path = default_storage.save(file_name, file)

            full_path = default_storage.path(saved_path)
            data = process_receipt(full_path)

            return JsonResponse({
                "message": "Extraction successful",
                "data": data,
                "image_path": saved_path
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        

@csrf_exempt
def save_expense(request):
    # AUTH CHECK
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            group_id = data.get("group_id")
            group = Group.objects.get(id=group_id)

            if user not in group.members.all():
                return JsonResponse({"error": "Not allowed"}, status=403)

            merchant = data.get("merchant")
            
            total = data.get("total")

            transaction_date= data.get("transaction_date")

            image_path = data.get("image_path")
            
            items = data.get("items", [])
            user_ids = data.get("user_ids", [])

            # Always include payer
            if user.id not in user_ids:
                user_ids.append(user.id)

            if not merchant or not total or not user_ids:
                return JsonResponse({"error": "Missing required fields"}, status =400)
            
            #Validate users
            users = []
            for uid in user_ids:

                try:
                    split_user = get_object_or_404(User, id=uid)
                    users.append(split_user)
                except User.DoesNotExist:
                    return JsonResponse({
                        "error": f"User with id {uid} does not exist"
                    }, status=400)

            split_amount = total / len(users)

            with transaction.atomic():

                # 1. Create Expense
                expense = Expense.objects.create(
                    merchant = merchant,
                    total=total,
                    transaction_date=transaction_date,
                    raw_data=data,
                    paid_by = user,
                    group = group
                )

                if image_path:
                    expense.receipt_image.name = image_path
                    expense.save()

                # 2. Create Items
                for item in items:
                    Item.objects.create(
                        expense=expense,
                        name=item.get("name"),
                        price=item.get("price"),
                        quantity=1
                    )
                
                # 3. Create Splits
                for split_user in users:
                    if split_user == user:
                        continue

                    Split.objects.create(
                        expense=expense,
                        user=split_user,
                        amount=split_amount
                    )   
            return JsonResponse({
                "message": "Expense saved successfully",
                "expense_id": expense.id
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Invalid method"}, status=405)

@csrf_exempt
def login_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            username = data.get("username")
            password = data.get("password")

            user = authenticate(username=username, password=password)

            if user is None:
                return JsonResponse({"error": "Invalid credentials"}, status=400)
            
            refresh = RefreshToken.for_user(user)

            response = JsonResponse({
                "message": "Login successful",
                "access": str(refresh.access_token),
            })
        
            # set http cookie

            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False, #True in production (HTTPS)
                samesite="Lax",
                path="/",
            )

            return response


        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        
    return JsonResponse({"error": "Invalid method"}, status = 400)


@csrf_exempt
def create_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            username = data.get("username")
            password = data.get("password")
            email = data.get("email")

            if not username or not password:
                return JsonResponse({"error": "Username and password required"}, status =400)
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "Username already exists"}, status=400)

            user = User.objects.create_user(
                username=username,
                password=password,
                email = email
            )

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response =  JsonResponse({
                "message": "User created successfully",
                "access": access_token
            })

            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False,  # True in production for Https
                samesite="Lax",
                path="/",
            )

            return response

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "invalid method"}, status=405)

@csrf_protect
def refresh_token_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    refresh_token = request.COOKIES.get("refresh_token")

    if not refresh_token:
        return JsonResponse({"error": "No refresh token"}, status=401)
    
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)

        return JsonResponse({
            "access": access_token
        })
    except Exception as e:
        print("REFRESH ERROR:", str(e))
        return JsonResponse({"error": "Invalid refresh token"}, status = 401)

@csrf_exempt
def get_balances(request):

    if request.method != "GET":
        return JsonResponse({"error": "Invalid method"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "unauthorized"}, status = 401)
    
    group_id = request.GET.get("group_id")
    
    splits = Split.objects.select_related("expense", "user")

    if group_id:
        group = get_object_or_404(Group, id=group_id)

        if user not in group.members.all():
            return JsonResponse({"error": "Not allowed"}, status=403)
        
        splits = splits.filter(expense__group_id=group_id)

    balance_map ={}

    for split in splits:
        payer = split.expense.paid_by
        owed = split.user
        amount = split.amount

        if payer == owed:
            continue

        if payer == user:
            balance_map[owed.id] = balance_map.get(owed.id,0) + amount

        elif owed == user:
            balance_map[payer.id] = balance_map.get(payer.id, 0) - amount

    you_owe = []
    you_are_owed =[]

    for uid, balance in balance_map.items():
        other_user = User.objects.get(id=uid)

        if balance > 0:
            you_are_owed.append({
                "user_id": uid,
                "username": other_user.username,
                "amount": round(balance, 2)
            })
        elif balance < 0:
            you_owe.append({
                "user_id": uid,
                "username": other_user.username,
                "amount": round(abs(balance), 2)
            })
    
    return JsonResponse({
        "you_owe": you_owe,
        "you_are_owed": you_are_owed
    })


@csrf_exempt
def get_users(request):
    if request.method != "GET":
        return JsonResponse({"error": "Invalid method"}, status =405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    users = User.objects.all()

    data = [
        {
            "id": u.id,
            "username": u.username
        }
        for u in users
    ]

    return JsonResponse({"users": data})

@csrf_exempt
def get_group_members(request, group_id):
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        group = Group.objects.get(id=group_id)

        if user not in group.members.all():
            return JsonResponse({"error": "Not allowed"}, status=403)
        
        members = group.members.all()

        data = [
            {"id": u.id, "username": u.username}
            for u in members
        ]

        return JsonResponse({"members": data})
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)


@csrf_exempt
def list_expenses(request):
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    group_id = request.GET.get("group_id")

    if not group_id:
        return JsonResponse({"error": "group_id required"}, status=400)
    
    group = Group.objects.get(id=group_id)

    if user not in group.members.all():
        return JsonResponse({"error": "Not allowed"}, status=403)

    expenses = Expense.objects.filter(
        group_id=group_id
    ).order_by("-transaction_date", "-created_at")

    return JsonResponse({
        "expenses": [
            {
                "id": e.id,
                "merchant": e.merchant,
                "total": float(e.total),
                "paid_by": e.paid_by.username,
                "date": e.transaction_date,

                "top_items": [
                    {
                        "name": item.name,
                        "price": float(item.price)
                    }
                    for item in e.items.all().order_by("-price")[:2]   # show top 2
                ]
            }
            for e in expenses
        ]
    })

@csrf_exempt
def expense_detail(request, expense_id):
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        expense = Expense.objects.prefetch_related("items").get(id=expense_id)

        if expense.group:
            if user not in expense.group.members.all():
                return JsonResponse({"error": "Not allowed"}, status=403)

        items = [
            {
                "name": item.name,
                "price": float(item.price)
            }
            for item in expense.items.all()
        ]
    
        return JsonResponse({
            "id": expense.id,
            "merchant": expense.merchant,
            "total": float(expense.total),
            "date": expense.transaction_date,
            "paid_by": expense.paid_by.username,
            "items": items,
            "image": expense.receipt_image.url if expense.receipt_image else None
        })
    except Expense.DoesNotExist:
        return JsonResponse({"error": "Expense not found"}, status=404)

@csrf_exempt
def delete_expense(request, expense_id):
    user = get_authenticated_user(request)

    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    if request.method != "DELETE":
        return JsonResponse({"error": "Invalid method"}, status=405)
    
    try:
        expense = Expense.objects.select_related("group", "paid_by").get(id=expense_id)
    except Expense.DoesNotExist:
        return JsonResponse({"error": "Expense not found"}, status=404)
    
    if expense.paid_by != user:
        return JsonResponse({"error": "Not allowed"}, status=403)
    
    expense.delete()

    return JsonResponse({"message": "Deleted successfully"})

@csrf_exempt
def create_group(request):
    user = get_authenticated_user(request)

    if not user:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    if request.method == "POST":
        data = json.loads(request.body)

        name = data.get("name")
        user_ids = data.get("user_ids", [])

        group = Group.objects.create(name=name)
        group.members.add(user)

        for uid in user_ids:
            if uid == user.id:
                continue

            try:
                member = User.objects.get(id=uid)
                group.members.add(member)
            except User.DoesNotExist:
                pass

        return JsonResponse({"message": "Group created"})

@csrf_exempt
def list_groups(request):
    user = get_authenticated_user(request)

    groups = Group.objects.filter(members=user)

    return JsonResponse({
        "groups": [
            {"id": g.id, "name": g.name}
            for g in groups
        ]
    })

@csrf_exempt
def delete_group(request, group_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Invalid method"}, status=405)
    
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        group = Group.objects.get(id=group_id)

        if user not in group.members.all():
            return JsonResponse({"error": "Not allowed"}, status=403)
        
        group.delete()

        return JsonResponse({"message": "Group deleted successfully"})
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)
