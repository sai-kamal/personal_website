# Generated by Django 2.2.2 on 2019-07-14 11:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_auto_20190714_1627'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projects',
            name='description',
            field=models.TextField(blank=True, default='Zero, zip, nada (only true fans will get this!!!)', max_length=500),
        ),
    ]
