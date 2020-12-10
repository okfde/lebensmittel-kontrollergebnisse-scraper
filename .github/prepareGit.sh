#!/bin/bash

git submodule init 
git submodule update
git -C results/ checkout master