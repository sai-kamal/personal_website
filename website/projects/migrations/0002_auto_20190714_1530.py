# Generated by Django 2.2.2 on 2019-07-14 10:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projects',
            name='id',
        ),
        migrations.AlterField(
            model_name='projects',
            name='name',
            field=models.CharField(max_length=100, primary_key=True, serialize=False),
        ),
    ]
