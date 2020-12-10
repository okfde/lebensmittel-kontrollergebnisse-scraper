#!/bin/bash

DATE=$(date '+%F')
git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"

git -C results/ add .
git -C results/ commit -m "Reports from $DATE" -a
git -C results/ push origin master

git add results
git commit -m "ci: update reports submodule"
remote_repo="https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
git push "${remote_repo}" master