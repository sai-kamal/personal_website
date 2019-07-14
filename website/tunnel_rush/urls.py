from django.urls import path
from . import views

urlpatterns = [
    path('', views.tunnel_rush, name='tunnel_rush'),
    path('update_high_score/', views.update_high_score, name='update_high_score'),
]
