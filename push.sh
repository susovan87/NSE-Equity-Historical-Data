#!/bin/sh

setup_git() {
  git config --global user.email "susovan87@gmail.com"
  git config --global user.name "susovan87"
}

commit_website_files() {
  git add . 
  git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
}

upload_files() {
  git remote add origin https://${GH_TOKEN}@github.com/susovan87/NSE-Equity-Historical-Data.git > /dev/null 2>&1
  git push --quiet --set-upstream origin master 
}

setup_git
commit_website_files
upload_files