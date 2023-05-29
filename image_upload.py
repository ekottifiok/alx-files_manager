import base64
import requests
import sys

token = '66217eb8-6f44-4b02-97be-2c978f7fb0b0'
file_path = 'imags'
name = 'images.jpg'
file_name = '/home/ifiokekott/alx-files_manager/image.jpg'

file_encoded = None
with open(file_name, "rb") as image_file:
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

r_json = { 'name': name, 'type': 'image', 'isPublic': True, 'data': file_encoded, 'parentId': file_path }
r_headers = { 'X-Token': token }
s = requests.post("http://0.0.0.0:5000/files", json={"name": file_path, 'type': 'folder'}, headers=r_headers)
print(s.json())
r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)
print(r.json())
