#!/bin/bash
echo "Installing SnapServer and dependencies..."
INSTALLING="/home/volumio/snapserver-plugin.installing"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING
	# Echo version number, for bug tracking purposes
	echo "## Installing SnapServer plugin v1.0.1 ##"
	
	echo "Detecting CPU architecture and Debian version"
	ARCH=$(dpkg --print-architecture)
	DEBIAN_VERSION=$(cat /etc/os-release | grep '^VERSION=' | cut -d '(' -f2 | tr -d ')"')
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
		fi
	elif [ $ARCH = "i386" ] || [ $ARCH = "i486" ] || [ $ARCH = "i586" ] || [ $ARCH = "i686" ] || [ $ARCH = "i786" ]; then
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

	# Backup old snap* installations
	mv /usr/sbin/snapserver /usr/sbin/snapserver.bak

	# Install packages (server and client) and dependencies
	for f in /home/volumio/snapserver/snap*.deb; do dpkg -i "$f"; done
	apt-get update && apt-get -f -y install
	
	# Link to administrative tools
	ln -fs /usr/bin/snapserver /usr/sbin/snapserver
	
	# Patch Volspotconnect2
	if [ -d "/data/plugins/music_service/volspotconnect2" ];
	then
		# Update volspotconnect2 template file (legacy config)
		sed -i -- 's|--device ${outdev}.*|--backend pipe --device /tmp/snapfifo ${normalvolume} \\|g' /data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl
		
		# Update volspotconnect2 template file (toml template); device and backend are amended
		sed -i -- 's|device =.*|device = \x27/tmp/snapfifo\x27|g' /data/plugins/music_service/volspotconnect2/volspotify.tmpl
		sed -i -- 's|backend =.*|backend = \x27pipe\x27|g' /data/plugins/music_service/volspotconnect2/volspotify.tmpl
	fi
	
	# Patch MPD config
	sed -i -- 's|.*enabled.*|    enabled         "yes"|g' /etc/mpd.conf
	sed -i -- 's|.*format.*|    format          "44100:16:2"|g' /etc/mpd.conf
	
	# Disable standard output to ALSA; insert enabled row below type, or set the value of enabled to "no"
	ALSA_ENABLED=$(sed -n "/.*type.*\"alsa\"/{n;p}" /etc/mpd.conf)

	case $ALSA_ENABLED in
	 *enabled*) sed -i -- '/.*type.*alsa.*/!b;n;c\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ enabled\ \ \ \ \ \ \ \ \ "no"' /etc/mpd.conf ;;
	 *) sed -i -- 's|.*type.*alsa.*|&\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ enabled\ \ \ \ \ \ \ \ \ "no"|g' /etc/mpd.conf ;;
	esac
		
	# Edit the systemd unit to create a new fifo pipe
	#systemctl enable /data/plugins/audio_interface/snapserver/unit/spotififo.service
	#systemctl start spotififo.service
	#systemctl disable snapserver.service
	
	# The new way of patching root-owned files from within plugins
	#systemctl enable /data/plugins/audio_interface/snapserver/unit/snap-activator.service
	#systemctl start snap-activator.service 
	
	# Reload the systemd manager config and restart MPD
	systemctl daemon-reload
	systemctl restart mpd
	systemctl stop snapserver
	
	# Remove files and replace them with symlinks
	rm /etc/default/snapserver
	ln -fs /data/plugins/audio_interface/snapserver/default/snapserver /etc/default/snapserver
	
	# Cleanup files
	rm -rf /home/volumio/snapserver
	rm $INSTALLING
	
	#required to end the plugin install
	echo "plugininstallend"

else
	echo "Plugin is already installing! Not continuing, check the log files for any errors during installation."
fi