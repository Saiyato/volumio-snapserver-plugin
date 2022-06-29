# volumio-snapserver-plugin
A new version of the SnapServer functionality, totally revamped.
Note that this is still a WIP, Airplay is not yet supported and you might break your instance.

## How do I en- or disable services?
Well, that's easy, it integrates seamlessly into Volumio, no need for complex configs and patching of files anymore. Just enable it and enjoy!

## So how about that AirPlay support?
Well, this is still in active investigation, for some reason I'm unable to get it working.

# What's the catch?
Well, nothing really. It just captures the output of the AAMPP architecture (after all manipulations like equalizers) and pipes it to `/tmp/snapfifo` (the fifo-file).

## So install this plugin, and that's it?
Almost, I'm still working on determining if I can sync while sending to the pipe in parallel. So for _local_ playback, you'll need to install the (new) client as well. This plugin will nullify all output to the hardware, and the client will grab from the stream and send it to the hardware.