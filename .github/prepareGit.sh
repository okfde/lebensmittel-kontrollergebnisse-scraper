#!/bin/bash

git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"

git submodule init 
git submodule update