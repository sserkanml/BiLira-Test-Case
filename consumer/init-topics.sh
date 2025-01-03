#!/bin/sh

# First create topics
node dist/init-topics.js

# Then start the application
pnpm start:prod 