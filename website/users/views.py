from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import UserSignUpForm


def signUp(request):
    '''creates the signUp form and renders it'''
    if request.method == 'POST':
        form = UserSignUpForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, 'Your account has been created ' +
                             username + '!!')
            return redirect('signIn')  # redirect to sigIn page
    form = UserSignUpForm()
    return render(request, 'users/signUp.html', {'form': form})
