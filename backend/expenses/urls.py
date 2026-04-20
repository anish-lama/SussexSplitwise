from django.urls import path
from .views import upload_receipt, save_expense, create_user, login_user, get_balances, get_users, list_expenses, expense_detail, delete_expense, list_groups, create_group,delete_group, get_group_members, refresh_token_view, get_csrf

urlpatterns = [
    path("upload-receipt/", upload_receipt),
    path("save-expenses/", save_expense),
    path("signup/", create_user),
    path("login/", login_user),
    path("balances/", get_balances),
    path("users/", get_users),
    path("list-expenses/", list_expenses),
    path("list-expenses/<int:expense_id>/", expense_detail),
    path("delete-expense/<int:expense_id>/", delete_expense),
    path("list-groups/", list_groups),
    path("create-group/", create_group),
    path("delete-group/<int:group_id>/", delete_group),
    path("get-group-members/<int:group_id>/", get_group_members),
    path("refresh/", refresh_token_view),
    path("csrf/", get_csrf),
]