from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# Create your models here.

#Group of users
class Group(models.Model):
    name = models.CharField(max_length=100)

    # many users in manygroups
    members = models.ManyToManyField(User, related_name='expense_groups')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    

# Expense
class Expense(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paid_expenses")
    merchant = models.CharField(max_length=255)
    
    total = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]    
    )
    transaction_date = models.DateField(null=True, blank=True)

    receipt_image = models.ImageField(upload_to="receipts/", null=True, blank=True)
    
    #AI output backup
    raw_data = models.JSONField() 

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.merchant} - {self.total}"
    
# Items inside an expense 
class Item(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name ="items")
    name= models.CharField(max_length=255, null=True, blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.FloatField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.price}"
    
# Split (Who owes what)
class Split(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="splits")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="splits")

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("expense", "user")

    def __str__(self):
        return f"{self.user.username} owes {self.amount}"

