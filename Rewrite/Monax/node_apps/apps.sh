#!/bin/bash
prefix='monaxapps'

if [ ! -z $2 ]; then
  prefix=$2
fi

prefix=$prefix + "_"

if [ ! -z $1 ]; then
  case $1 in
    "start" )
    if [ ! -f "$prefix.instance.lock" ]; then
      echo "Starting new instance of monax node apps (identifier: $prefix)"
      for i in $(ls); do
        if [ -d $i ]; then
          if [ -f ./$i/index.js ]; then
            if [ ${#i} -gt 2 ]; then
              cd $i

              screen -dmS "$prefix$i" /bin/bash &
              pid=$(screen -ls | grep $prefix$i | sed s/'\t'//g | cut -f1 -d '.')
              echo "$pid:$prefix$i " >> "../$prefix.instance.lock"
              dir=$(pwd)
              screen -S $prefix$i -X stuff $"cd $dir\r"
              screen -S $prefix$i -X stuff $"node index.js\r"
              
              echo "[return: $?][pid: $!] $i app started in background (socket: $prefix$i)."

              cd ..
            fi
          fi
        fi
      done
    else
      echo 'Instance already exists: stop existing instance with the stop script or delete instance.lock to override.'
    fi
    ;;
    "stop" )
    if [ -f "$prefix.instance.lock" ]; then
      for i in $(cat $prefix.instance.lock); do
        svc=$(echo $i | cut -f2 -d ':')
        screen -S $svc -X stuff ^C^C
        screen -S $svc -X stuff ^D^D
        echo "[return: $?][pid: $!] $svc app stopped in background."
      done
      rm "$prefix.instance.lock"
      echo 'Stopped apps. Cleaning up orphans...'
      count=0
      for i in $(screen -ls | grep $prefix | cut -f1 -d '.' | sed s/'\t'/%/g | cut -f2 -d '%'); do
        sudo kill $i
        count=$(($count+1))
      done
      echo "Force killed $count orphaned apps."
    else
      echo 'No instance.lock file found.'
    fi
    ;;
    "clean" )
    echo 'Cleaning up orphans...'
      count=0
      for i in $(screen -ls | grep $prefix | cut -f1 -d '.' | sed s/'\t'/%/g | cut -f2 -d '%'); do
        sudo kill $i
        count=$(($count+1))
      done
      echo "Force killed $count orphaned apps."
    ;;
  esac
  echo "done"
else
  echo 'Usage: ./apps.sh [start|stop]'
fi
