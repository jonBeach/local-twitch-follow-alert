import webbrowser
import os
import sys
import requests
import json
import random
import string
from env_manager import Env

# Load env variables
env = Env()
env.load_env()
CLIENT_ID = env.get_env_variable('CLIENT_ID')
REDIRECT_URI = env.get_env_variable('REDIRECT_URI')
CLIENT_SECRET = env.get_env_variable('CLIENT_SECRET')

STATE_CODE = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

# Scope of what the oauth wants to access
SCOPES = [
	'user:read:follows',
	'moderator:read:followers'
]

# oauth url
auth_app_url = (
	f'https://id.twitch.tv/oauth2/authorize'
	f'?response_type=code'
	f'&client_id={CLIENT_ID}'
	f'&redirect_uri={REDIRECT_URI}'
	f'&scope={" ".join(SCOPES)}'
	f'&state={STATE_CODE}'
)

auth_token_url_params = {
	'client_id': CLIENT_ID,
	'client_secret': CLIENT_SECRET,
	'code': None,
	'grant_type': 'authorization_code',
	'redirect_uri': REDIRECT_URI
}

defualt_browser = True

# Some browser paths for webbrowser registration
browser_paths = [
	('chrome','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'),
	('chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'),
	('firefox','C:/Program Files/Mozilla Firefox/firefox.exe'),
	('firefox','C:/Program Files (x86)/Mozilla Firefox/firefox.exe')
]


def register_browsers() -> None:
	"""
	Registers browsers so webbrowser can find them
	without this webbrowser cant see any browsers
	"""
	for name, path in browser_paths:
		if os.path.isfile(path):
			webbrowser.register(name, None, webbrowser.BackgroundBrowser(path))


def get_browser(browser: str) -> webbrowser.BackgroundBrowser | bool:
	"""Changes browser if found"""
	try:
		browser = webbrowser.get(browser)
		return browser
	except webbrowser.Error:
		print('Failed to find browser. Using default browser!')
		return None


def get_user_id(access_token: str) -> str | None:

	user_id_url = 'https://api.twitch.tv/helix/users'
	headers = {
		'Authorization': f'Bearer {access_token}',
		'Client-Id': CLIENT_ID
	}

	response = requests.get(user_id_url, headers=headers)

	if response.status_code == 200:
		user_id = response.json()['data'][0]['id']
		return user_id
	else:
		print(
			f'Error getting user id!\n'
			f'Staus Code: {response.status_code}\n'
			f'Error Message: {response.text}'
		)
		return None


def get_user_code(url: str) -> str | None:
	"""
	Gets the users 'code' needed to access
	the users 'access_token' and 'refresh_token'
	from the given url(uri).
	"""
	params = url.split('?')[1]
	params = params.split('&')

	code = None
	for param in params:
		key, value = param.split('=')

		if key == 'code':
			code = value
		if key == 'state' and value == STATE_CODE:
			return code
	return None


def get_tokens(code: str, params: dict) -> dict | None:
	"""
	Sends a request with the needed params and gets
	the users 'access_token' and 'refresh_token' in
	response.
	"""
	if not code:
		return None

	params['code'] = code

	token_url = 'https://id.twitch.tv/oauth2/token'

	try:
		response = requests.post(token_url, data=params)

		if response.status_code == 200:
			return response.json()
		else:
			print(
				f'Error getting Tokens:\n'
				f'Status Code: {response.status_code}\n'
				f'Message: {response.text}'
			)
			return None

	except requests.exceptions.RequestException as e:
		print(f'Error getting Tokens: {e}')
		return None


def edit_html_file(access_token: str, user_id: str, refresh_token: str) -> bool:
	html_injection_text = [
		"\t<script id='config' type='application/json'>\n",
		"\t\t{\n",
		f'\t\t\t"access_token": "{access_token}",\n',
		f'\t\t\t"refresh_token": "{refresh_token}",\n',
		f'\t\t\t"client_id": "{CLIENT_ID}",\n',
		f'\t\t\t"client_secret": "{CLIENT_SECRET}",\n',
		f'\t\t\t"user_id": "{user_id}"\n',
		"\t\t}\n",
		"\t</script>\n"
	]
	try:
		with open('defaultindex', 'r') as html_file:
			lines = html_file.readlines()

	except Exception as e:
		print(f'Error reading defaultindex file')
		return False

	lines = lines[:lines.index('<body>\n')+1] + html_injection_text + lines[lines.index('<body>\n')+1:]

	try:
		with open('index.html', 'w') as new_html:
			new_html.writelines(lines)
	except Exception as e:
		print(f'Error writing to index.html file')
		return False

	print('\n\nindex.html successfully injected!')
	return True

def main():
	register_browsers()

	print(
		'OAuth for twitch account needed!\n'
		'Web browser will be used to log you in.\n'
	)

	print(
		'Enter nothing to use the default browser\n'
		'If you would like to use non default browser'
		' - enter your browser of choice!\n'
		'Common browser names:'
	)

	browser_names = [
		'chrome',
		'firefox'
	]

	# Formating in console
	for browser in browser_names:
		print(f'{" ":>2}- {browser}')

	change_browser = input('\nBrowser: ')


	print(
		'Opening browser!\n'
		'When redirected to "localhost" paste the entire url in here'
	)
	if change_browser:
		new_browser = get_browser(change_browser)
		if new_browser:
			new_browser.open(auth_app_url)
		else:
			webbrowser.open(auth_app_url)
	else:
		webbrowser.open(auth_app_url)

	code_url = input('\nOauth URL: ')

	code = get_user_code(code_url)

	tokens = get_tokens(code, auth_token_url_params)

	if not tokens:
		sys.exit('No Tokens found. Try again?!?')

	try:
		access_token = tokens['access_token']
		refresh_token = tokens['refresh_token']

		user_id = get_user_id(access_token)

		html_success = edit_html_file(access_token, user_id, refresh_token)
		print(f'\nAccess Token: {access_token}')

		if html_success:
			print('Everything is setup, just run "index.html" !')
	except Exception as e:
		print(
			f'This might be your access token: {access_token}'
		)

if __name__ == '__main__':
	main()