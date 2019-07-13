from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('signUp/', views.signUp, name='signUp'),
    path('signIn/', auth_views.LoginView.as_view(template_name='users/' +
                                                 'signIn.html'),
         name='signIn'),
    path('signOut/', auth_views.LogoutView.as_view(template_name='users/' +
                                                   'signOut.html'),
         name='signOut'),
]
