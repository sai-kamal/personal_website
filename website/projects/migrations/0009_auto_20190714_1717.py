# Generated by Django 2.2.2 on 2019-07-14 11:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_auto_20190714_1716'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projects',
            name='description',
            field=models.TextField(blank=True, max_length=500, null=True),
        ),
    ]
