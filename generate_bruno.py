import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

auth_files = {
    'bruno/Auth/Register.bru': '''meta {
  name: Register
  type: http
  seq: 1
}
post {
  url: {{baseUrl}}/auth/register
  body: json
  auth: none
}
body:json {
  {
    "email": "admin@example.com",
    "password": "Password123!",
    "firstName": "Admin",
    "lastName": "User",
    "organizationName": "Test Org"
  }
}''',
    'bruno/Auth/Login.bru': '''meta {
  name: Login
  type: http
  seq: 2
}
post {
  url: {{baseUrl}}/auth/login
  body: json
  auth: none
}
body:json {
  {
    "email": "admin@example.com",
    "password": "Password123!"
  }
}
script:post-response {
  if (res.status === 200) {
    bru.setEnvVar("accessToken", res.body.data.tokens.accessToken);
    bru.setEnvVar("refreshToken", res.body.data.tokens.refreshToken);
  }
}''',
    'bruno/Auth/Refresh.bru': '''meta {
  name: Refresh
  type: http
  seq: 3
}
post {
  url: {{baseUrl}}/auth/refresh
  body: json
  auth: none
}
body:json {
  {
    "refreshToken": "{{refreshToken}}"
  }
}
script:post-response {
  if (res.status === 200) {
    bru.setEnvVar("accessToken", res.body.data.tokens.accessToken);
    bru.setEnvVar("refreshToken", res.body.data.tokens.refreshToken);
  }
}''',
    'bruno/Auth/Logout.bru': '''meta {
  name: Logout
  type: http
  seq: 4
}
post {
  url: {{baseUrl}}/auth/logout
  body: json
  auth: none
}
body:json {
  {
    "refreshToken": "{{refreshToken}}"
  }
}
script:post-response {
  if (res.status === 200) {
    bru.setEnvVar("accessToken", "");
    bru.setEnvVar("refreshToken", "");
  }
}''',
    'bruno/Auth/Forgot Password.bru': '''meta {
  name: Forgot Password
  type: http
  seq: 5
}
post {
  url: {{baseUrl}}/auth/forgot-password
  body: json
  auth: none
}
body:json {
  {
    "email": "admin@example.com"
  }
}''',
    'bruno/Auth/Reset Password.bru': '''meta {
  name: Reset Password
  type: http
  seq: 6
}
post {
  url: {{baseUrl}}/auth/reset-password
  body: json
  auth: none
}
body:json {
  {
    "token": "reset_token_here",
    "password": "NewPassword123!"
  }
}'''
}

org_files = {
    'bruno/Organizations/Get My Org.bru': '''meta {
  name: Get My Org
  type: http
  seq: 1
}
get {
  url: {{baseUrl}}/organizations/me
  body: none
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}''',
    'bruno/Organizations/Update My Org.bru': '''meta {
  name: Update My Org
  type: http
  seq: 2
}
patch {
  url: {{baseUrl}}/organizations/me
  body: json
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
body:json {
  {
    "name": "Updated Org Name"
  }
}'''
}

user_files = {
    'bruno/Users/List Users.bru': '''meta {
  name: List Users
  type: http
  seq: 1
}
get {
  url: {{baseUrl}}/users
  body: none
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}''',
    'bruno/Users/Invite User.bru': '''meta {
  name: Invite User
  type: http
  seq: 2
}
post {
  url: {{baseUrl}}/users/invite
  body: json
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
body:json {
  {
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "operator"
  }
}''',
    'bruno/Users/Get User.bru': '''meta {
  name: Get User
  type: http
  seq: 3
}
get {
  url: {{baseUrl}}/users/:userId
  body: none
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
vars:pre-request {
  userId: user_id_here
}''',
    'bruno/Users/Update User.bru': '''meta {
  name: Update User
  type: http
  seq: 4
}
patch {
  url: {{baseUrl}}/users/:userId
  body: json
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
vars:pre-request {
  userId: user_id_here
}
body:json {
  {
    "firstName": "Updated"
  }
}''',
    'bruno/Users/Deactivate User.bru': '''meta {
  name: Deactivate User
  type: http
  seq: 5
}
post {
  url: {{baseUrl}}/users/:userId/deactivate
  body: none
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
vars:pre-request {
  userId: user_id_here
}''',
    'bruno/Users/Reactivate User.bru': '''meta {
  name: Reactivate User
  type: http
  seq: 6
}
post {
  url: {{baseUrl}}/users/:userId/reactivate
  body: none
  auth: bearer
}
auth:bearer {
  token: {{accessToken}}
}
vars:pre-request {
  userId: user_id_here
}'''
}

all_files = {**auth_files, **org_files, **user_files}

for path, content in all_files.items():
    write_file(path, content)

print("Bruno collection generated successfully.")
