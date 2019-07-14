from django.db import models


def default_str():
    return 'Zero, zip, nada (only true fans will get this!!!)'


class Projects(models.Model):
    '''stores github repos' info'''
    name = models.CharField(max_length=100, primary_key=True)
    description = models.TextField(max_length=500, blank=True, null=True)
    html_url = models.URLField()

    def __str__(self):
        return self.name
