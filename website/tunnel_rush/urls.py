from django.urls import path
from . import views

urlpatterns = [
    path('', views.tunnel_rush, name='tunnel_rush'),
]
