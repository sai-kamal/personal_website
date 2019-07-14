from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectsListView.as_view(), name='projects_index'),
    path('get_repos/', views.get_github_repos, name='get_github_repos'),
]
