from app import app, db
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
import os

# Initialize Flask-Migrate
migrate = Migrate(app, db)
manager = Manager(app)

# Add the 'db' command to the manager
manager.add_command('db', MigrateCommand)

@manager.command
def init_db():
    """Initialize the database."""
    if not os.path.exists('migrations'):
        os.system('flask db init')
    os.system('flask db migrate -m "Initial migration"')
    os.system('flask db upgrade')
    print("Database initialized and migrated!")

if __name__ == '__main__':
    init_db()
    manager.run()