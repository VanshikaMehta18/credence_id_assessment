import os

class Config:
    PORT = int(os.getenv('PORT', 3000))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    DATABASE_PATH = os.getenv('DATABASE_PATH', '../database/verification.db')