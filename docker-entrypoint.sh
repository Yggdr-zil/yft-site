#!/bin/sh
set -e

export CONTACT_PORT=3001

cd /opt/contact-server
PORT=$CONTACT_PORT node index.js &

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
