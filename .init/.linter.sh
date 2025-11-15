#!/bin/bash
cd /home/kavia/workspace/code-generation/reservation-manager-253076-253085/frontend_reservation_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

