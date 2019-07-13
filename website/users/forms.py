from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm


class UserSignUpForm(UserCreationForm):
    '''extends the UserCreationForm to make our own custom form
    with extra fields'''
    email = forms.EmailField()

    class Meta:
        # used to specify the model with which this form is going to interact.
        # for example form.save()
        model = User
        # the fields and the order in which they are showcased in the form.
        fields = ['username', 'email', 'password1', 'password2']
