#!/bin/bash

set -e

APP_NAME="open-cors-proxy"
ENV_NAME="open-cors-proxy-env"
REGION="us-east-1"  # Change to your preferred region

echo "🔑 Make sure you have run: aws configure (with a user that has Beanstalk permissions)"
sleep 2

# 1. Install EB CLI (if missing)
if ! command -v eb &> /dev/null; then
  echo "🔧 Installing AWS Elastic Beanstalk CLI..."
  pip install --user awsebcli
  export PATH=$PATH:$HOME/.local/bin
fi

# 2. Install node modules and zip project (excluding node_modules/.git)
echo "📦 Installing dependencies..."
npm install

echo "📦 Zipping source (excluding node_modules, .git)..."
ZIPNAME="${APP_NAME}.zip"
zip -r $ZIPNAME . -x "*.git*" "node_modules/*"

# 3. Init Beanstalk app if not present
if [ ! -d ".elasticbeanstalk" ]; then
  echo "🚀 Initializing Elastic Beanstalk app..."
  eb init $APP_NAME --platform node.js --region $REGION
fi

# 4. Create environment if not present
ENV_EXISTS=$(eb list | grep $ENV_NAME || true)
if [ -z "$ENV_EXISTS" ]; then
  echo "🌱 Creating environment $ENV_NAME..."
  eb create $ENV_NAME --instance_type t2.micro
else
  echo "♻️ Using existing environment $ENV_NAME"
fi

# 5. Deploy
echo "🚀 Deploying $ZIPNAME to Elastic Beanstalk..."
eb deploy

# 6. Upload .env as environment variables (optional, but recommended)
if [ -f ".env" ]; then
  echo "🌍 Uploading .env environment variables to Elastic Beanstalk..."
  # This will parse all KEY=VALUE pairs (ignoring comments/empty lines) and push to AWS
  eb setenv $(grep -v '^#' .env | xargs)
else
  echo "⚠️  No .env file found. Skipping environment variables upload."
fi

# 7. Output environment URL
echo ""
echo "✅ Deployment done! Your app should be available at:"
eb status | grep "CNAME:" | awk '{print "https://"$2}'

echo "🎉 All set! Your .env environment variables have been set on AWS Elastic Beanstalk."
