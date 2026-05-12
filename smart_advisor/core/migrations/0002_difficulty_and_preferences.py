from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        # 1. Remove the old 'credits' integer column
        migrations.RemoveField(
            model_name="course",
            name="credits",
        ),
        # 2. Add 'difficulty' CharField
        migrations.AddField(
            model_name="course",
            name="difficulty",
            field=models.CharField(
                choices=[
                    ("easy", "Easy"),
                    ("medium", "Medium"),
                    ("hard", "Hard"),
                    ("very_hard", "Very Hard"),
                ],
                default="medium",
                max_length=10,
            ),
        ),
        # 3. Add preferred_subjects JSONField to Student
        migrations.AddField(
            model_name="student",
            name="preferred_subjects",
            field=models.JSONField(default=list, blank=True),
        ),
    ]