#!/usr/bin/env bash

sendFile() {
  # echo "Sending file" "$1" to "$TARGET"
  curl -s -F "name=$1" -F "data=@$1" "$TARGET"
  sleep 0.01  # A slight delay is necessary here to not overrun buffers in the consumer
}

if [[ "$DELAY" == "" ]]; then
 DELAY=0
fi

echo "Stream-of-Code generator DEBUG."
echo "Delay (seconds) between each file is:" $DELAY
echo "files are sent to                   :" $TARGET

echo "Waiting 5 seconds to give consumer time to get started..."
sleep 5

while true; do
  echo "Sending test files..."
  sendFile ./test/A.java
  sleep $DELAY
  sendFile ./test/B.java
  echo "Sent test files. Sleeping before repeating..."
  sleep $DELAY
done