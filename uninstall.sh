#!/bin/bash

# Uninstall dependendencies
apt-get remove -y --purge snapserver

# restore old snap* installations
mv /usr/sbin/snapserver.bak /usr/sbin/snapserver

echo "Done"
echo "pluginuninstallend"