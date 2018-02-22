# Generated by Django 2.0.1 on 2018-02-19 09:25

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0009_alter_user_last_name_max_length'),
        ('forms', '0002_auto_20180212_1232'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserGroup',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('O', 'Owner'), ('A', 'Admin'), ('E', 'Editor'), ('A', 'Auditor'), ('V', 'Viewer')], default='V', max_length=1)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.Group')),
                ('investigation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='forms.Investigation')),
            ],
        ),
    ]
