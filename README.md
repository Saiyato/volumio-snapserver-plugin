# volumio-snapserver-plugin
A new version of the SnapServer functionality, totally revamped.
Note that this is still a WIP, Airplay is not yet supported and you might break your instance.

## How do I en- or disable services?
Well, that's easy, you can just toggle the switches in the 'Modify Audio Player Integrations' section; the press 'Patch'. The plugin will do the rest.
Don't want a service to output to SnapCast anymore? No worries, just toggle it off and the plugin will return to the old/default settings.

## So how about that AirPlay support?
Well, this is still in active investigation, because AirPlay is a core-functionality within Volumio (not regarded a plugin). This means, editing these settings will break the Volumio upgrade process (because core files have been tampered with). Not ideal... 

### Files edited by this plugin
The install script copies the below config:
/mnt/overlay/dyn/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl

These settings will not be edited by the install script, but those should... in theory... enable AirPlay for SnapCast.
```
#alsa =
#{
#  output_device = "${device}";
#  ${buffer_size_line}
#};

pipe =
{
  name = "/tmp/snapfifo";
}
```

The enablement of Airplay is theoretical, at some point it worked, but it doesn't seem to work anymore. Work is needed!

## If you're feeling like an expert...
You can edit all kinds of settings, but this will void any warranties :wink: The default settings are supposed to work on most, if not any system.

### Working config
For MPD I use the following:

```
44.1kHz
16 bits
2 channels
```

Subsequently I use the same settings for the outgoing stream, this seems to be working for MPD, Airplay (if and when enabled) and Spotify (all implementations).
Setting stream (and MPD, to prevent resampling) to 48kHz seems to sound slightly accelerated in comparison to 44.1kHz when playing Spotify streams.

Problems arise when you put 44.1kHz into the pipe and have the pipe resample to 48kHz.

### Restore core-files
`volumio updater restorevolumio`
