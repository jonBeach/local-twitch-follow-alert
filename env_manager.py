import os

class Env:
	"""Manages env variables"""
	def __init__(self):
		self.file_dir = os.getcwd()
		self.file_path = None

	def change_env_dir(self, path):
		"""Change file directory to the dir of your choosing"""
		self.file_dir = path

	def find_env_file(self):
		"""Trys to find file in directory given"""
		self.file_path = os.path.join(self.file_dir, '.env')

		return os.path.isfile(self.file_path)

	def load_env(self, *, override: bool=False):
		"""
		Reads env file if found
		Added variable in env file to OS environment
		Can have bugs if user trys to mess with env file
		"""
		if not self.find_env_file():
			return '.env file not found!'

		try:
			# Open file path for env file and reads it
			with open(self.file_path, 'r') as file:
				for line in file:
					line = line.strip()

					# Ignore line if emtpy or comment
					if not line or line.startswith('#'):
						continue

					if '=' in line:
						key, value = line.split('=', 1)

						key = key.strip()
						value = value.strip().strip("'").strip('"')

						# Adds key value to OS environment
						if override or key not in os.environ:
							os.environ[key] = value

		except FileNotFoundError:
			print(f'.env file not found at {self.file_path}')

	def get_env_variable(self, key):
		"""
		Returns keys value if in OS environment
		Returns None if not found
		"""
		return os.getenv(key)

	def print_all_env_variables(self):
		"""
		Prints ALL OS environment variables
		Will print everything including
		non related project variables
		"""
		for key, value in os.environ.items():
			print(f'{key}={value}')