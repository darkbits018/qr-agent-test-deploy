import os
from datetime import timedelta
from flask import Flask
from geventwebsocket.handler import WebSocketHandler
from blueprints.auth import jwt_blacklist
from config import Config
from blueprints import superadmin, organization, kitchen, customer, auth, group
from models import db
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, jwt_required
from models.user import User
from models.organization import Organization
from models.menu_item import MenuItem
from models.table import Table
from models.order import Order
from models.order_item import OrderItem
from models.payment import Payment
from models.feedback import Feedback
from flask_migrate import Migrate
from flasgger import Swagger
from flask_cors import CORS
from flask_sockets import Sockets
from gevent import pywsgi
from websockets import register_sockets
from services.embedding_service import EmbeddingService


def create_app():
    app = Flask(__name__)

    # Load all configurations from the Config object
    app.config.from_object(Config)

    # Initialize extensions
    jwt = JWTManager(app)
    # Configure CORS to allow requests from frontend
    CORS(app, 
         resources={r"/*": {
             "origins": ["http://localhost:8080"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }},
         expose_headers=["Content-Type", "Authorization"]
         )
    db.init_app(app)
    sockets = Sockets(app)
    register_sockets(sockets)
    migrate = Migrate(app, db)
    Swagger(app)

    # Register blueprints
    app.register_blueprint(superadmin.bp)
    app.register_blueprint(organization.bp)
    app.register_blueprint(kitchen.bp)
    app.register_blueprint(customer.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(group.bp)

    # with app.app_context():
    #     db.create_all()

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload['jti'] in jwt_blacklist

    @app.route('/')
    def health_check():
        return {'status': 'OK'}

    return app


if __name__ == '__main__':
    app = create_app()
    # Use environment variable for port, default to 8001 to match docker-compose
    port = int(os.environ.get("PORT", 8001))
    server = pywsgi.WSGIServer(
        ('0.0.0.0', port), app, handler_class=WebSocketHandler)
    print(f"Server running on ws://localhost:{port}")
    server.serve_forever()
