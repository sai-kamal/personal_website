import os
import json
import requests
from django.shortcuts import render, redirect
from django.views.generic import ListView
from .models import Projects


class ProjectsListView(ListView):
    model = Projects
    template_name = 'projects/projects.html'
    context_object_name = 'projects'
    paginate_by = 4


def get_github_repos(request=None):
    '''gets projects list from github for username present in json'''
    # TODO: make this a cronjob
    with open(os.path.abspath('../config.json')) as config_fp:
        config = json.load(config_fp)
    url = 'https://api.github.com/users/' + config['github_username'] + \
          '/repos'
    response = requests.get(url)
    repos_dict = response.json()
    update_repos_DB(repos_dict)
    if request:
        return redirect('projects_index')
    else:
        return repos_dict


def update_repos_DB(repos_dict):
    '''Given a dict of info about repos, this function updates
    the info of these repos'''
    for repo in repos_dict:
        try:
            project = Projects.objects.get(name=repo['name'])
            project.description = repo['description']
            project.html_url = repo['html_url']
        except Projects.DoesNotExist:
            project = Projects(name=repo['name'],
                               description=repo['description'],
                               html_url=repo['html_url'])
        project.save()
