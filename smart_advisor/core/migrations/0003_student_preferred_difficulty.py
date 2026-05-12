from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_difficulty_and_preferences"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="preferred_difficulty",
            field=models.CharField(
                choices=[
                    ("easy", "Easy"),
                    ("medium", "Medium"),
                    ("hard", "Hard"),
                    ("very_hard", "Very Hard"),
                ],
                default="hard",
                max_length=10,
            ),
        ),
    ]