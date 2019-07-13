from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
def index(request):
    '''renders home page of the website'''
    return render(request, 'tunnel_rush/index.html')


def tunnel_rush(request):
    '''renders the tunnel rush game webpage'''
    return render(request, 'tunnel_rush/tunnel_rush.html')
