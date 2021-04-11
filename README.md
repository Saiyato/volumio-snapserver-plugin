# volumio-snapserver-plugin
 A new version of the SnapServer functionality, totally revamped.


## Files edited by this plugin
/mnt/overlay/dyn/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl

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

### Restore core-files
`volumio updater restorevolumio`