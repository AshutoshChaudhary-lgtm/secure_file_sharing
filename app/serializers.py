from rest_framework import serializers
from .models import File, Comment

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'name', 'uploaded_at', 'owner', 'shared_with']

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'file', 'user', 'content', 'created_at']