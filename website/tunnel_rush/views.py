from django.shortcuts import render
from django.http import HttpResponse
from users.models import Profile
from django.contrib.auth.decorators import login_required


# Views for general functions of website
def index(request):
    '''renders home page of the website'''
    return render(request, 'tunnel_rush/index.html')


def sorting_func(x):
    return x.high_score


# ------------------- Views specifically for actions related to Tunnel Rush -------------------- #
@login_required
def tunnel_rush(request):
    '''renders the tunnel rush game webpage'''
    profiles = sorted(Profile.objects.all(), key=sorting_func, reverse=True)[:7]
    return render(request, 'tunnel_rush/tunnel_rush.html',
                  {'profiles': profiles, 'user': request.user})


@login_required
def update_high_score(request):
    '''updates the high score of a player'''
    if request.method == 'POST':
        request.user.profile.high_score = request.POST['high_score']
        request.user.save()
    return HttpResponse('')
