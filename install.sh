#!/bin/bash
echo "Installing SnapServer and dependencies..."
INSTALLING="/home/volumio/snapserver-plugin.installing"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING
	# Echo version number, for bug tracking purposes
	echo "## Installing SnapServer plugin v1.3.9 ##"
	
	echo "Detecting CPU architecture and Debian version"
	ARCH=$(dpkg --print-architecture)
	DEBIAN_VERSION=$(cat /etc/os-release | grep '^VERSION=' | cut -d '(' -f2 | tr -d ')"')
	VOLUMIO_VERSION=$(cat /etc/os-release | awk '/VOLUMIO_VERSION/ { split($0,v,"="); gsub(/"/,"",v[2]); print v[2] }')
	VOLUMIO_MAJOR=$(cat /etc/os-release | awk '/VOLUMIO_VERSION/ { split($0,v,"="); gsub(/"/,"",v[2]); split(v[2],m,"."); print m[1] }')
	SNAPCONF="NO"
	echo "CPU architecture: " $ARCH
	echo "Debian version: " $DEBIAN_VERSION

	# Download latest SnapCast server package
	mkdir /home/volumio/snapserver

	if [ $ARCH = "armhf" ] ; then
		if [ $DEBIAN_VERSION = "jessie" ]; then
			echo "Defaulting to known working version of SnapCast components (0.15.0-armhf)"
			cp -f /data/plugins/audio_interface/snapserver/binaries/snapserver_0.15.0_armhf.deb /home/volumio/snapserver
		else
			echo "Fetching latest releases of SnapCast components..."
			wget $(curl -s https://api.github.com/repos/badaix/snapcast/releases/latest | grep 'armhf' | grep 'server' | cut -d\" -f4) -P /home/volumio/snapserver
			SNAPCONF="YES"
		fi
	elif [ $ARCH = "i386" ] || [ $ARCH = "i486" ] || [ $ARCH = "i586" ] || [ $ARCH = "i686" ] || [ $ARCH = "i786" ]; then
		echo "Not sure if x86 is supported, might need compilation... Detected architecture: " $ARCH
	elif [ $ARCH = "amd64" ]; then
		if [ $DEBIAN_VERSION = "jessie" ]; then
			echo "Defaulting to known working version of SnapCast components (0.15.0-amd64)"
			cp -f /data/plugins/audio_interface/snapserver/binaries/snapserver_0.15.0_amd64.deb /home/volumio/snapserver			
		else
			echo "Fetching latest releases of SnapCast components..."
			wget $(curl -s https://api.github.com/repos/badaix/snapcast/releases/latest | grep 'amd64' | grep 'server' | cut -d\" -f4) -P /home/volumio/snapserver
		fi
	else 
		echo "This architecture is not yet supported, you must build the snap*-packages yourself. Detected architecture: " $ARCH
	fi

	# Backup old snap* installations (if any)
	mv /usr/sbin/snapserver /usr/sbin/snapserver.bak

	# Install packages (server and client) and dependencies
	for f in /home/volumio/snapserver/snap*.deb; do dpkg -i "$f"; done
	apt-get update && apt-get -f -y install
	
	# Link to administrative tools; enables the global CLI command
	ln -fs /usr/bin/snapserver /usr/sbin/snapserver	

	# In Volumio 3.x; this will generate an error, but nothing will break, so we leave it in here
	systemctl disable snapserver.service
		
	# Reload the systemd manager config
	systemctl daemon-reload
	systemctl stop snapserver 
	
	# Remove files and replace them with symlinks
	echo "Modifying configuration to minimal config for the Volumio use-case..."
	rm /etc/default/snapserver
	ln -fs /data/plugins/audio_interface/snapserver/default/snapserver /etc/default/snapserver
	if [ $SNAPCONF = "YES" ]; then
		echo "Using new config template, removing legacy configuration"
		rm /etc/snapserver.conf
		ln -fs /data/plugins/audio_interface/snapserver/templates/snapserver.conf /etc/snapserver.conf
		sed -i -- "s|^SNAPSERVER_OPTS.*||g" /etc/default/snapserver
	fi
	
	# Fix UIConf to match version (Volumio 3.x makes use of the AAMPP architecture, which remove the need to patch files)
	if [ "$VOLUMIO_MAJOR" -gt "2" ]; then
		echo "Disabling complex configuration options, AAMPP will take care of that"
		mv /data/plugins/audio_interface/snapserver/UIConfig.json /data/plugins/audio_interface/snapserver/UIConfig.json.complex
		mv /data/plugins/audio_interface/snapserver/UIConfig.json.simple /data/plugins/audio_interface/snapserver/UIConfig.json
		mv /data/plugins/audio_interface/snapserver/index.js /data/plugins/audio_interface/snapserver/index.js.complex
		mv /data/plugins/audio_interface/snapserver/index.js.simple /data/plugins/audio_interface/snapserver/index.js
	fi
	
	# Cleanup files
	rm -rf /home/volumio/snapserver
	chown -R snapserver:snapserver /var/lib/snapserver
	rm $INSTALLING
	
	#required to end the plugin install
	echo "plugininstallend"

else
	echo "Plugin is already installing! Not continuing, check the log files for any errors during installation."
fi