'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

module.exports = snapserver;
function snapserver(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

snapserver.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
}

snapserver.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();


	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

snapserver.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

snapserver.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

snapserver.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

	var ratesdata = fs.readJsonSync((__dirname + '/options/sample_rates.json'),  'utf8', {throws: false});
	var bitdephtdata = fs.readJsonSync((__dirname +'/options/bit_depths.json'),  'utf8', {throws: false});
	var codecdata = fs.readJsonSync((__dirname + '/options/codecs.json'),  'utf8', {throws: false});
	
    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
		.then(function(evaluate)
		{
			console.log('$$$ Evaluating settings');
			// Verify configs			
			defer.resolve(evaluate);
		})
        .then(function(uiconf)
        {
			console.log('$$$ Populating settings form');
			
			// Main stream
			uiconf.sections[0].content[0].value = self.config.get('main_stream_name');
			for (var n = 0; n < ratesdata.sample_rates.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[1].options', {
					value: ratesdata.sample_rates[n].rate,
					label: ratesdata.sample_rates[n].name
				});
				
				if(ratesdata.sample_rates[n].rate == parseInt(self.config.get('main_stream_sample_rate')))
				{
					uiconf.sections[0].content[1].value.value = ratesdata.sample_rates[n].rate;
					uiconf.sections[0].content[1].value.label = ratesdata.sample_rates[n].name;
				}
			}
			for (var n = 0; n < bitdephtdata.bit_depths.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[2].options', {
					value: bitdephtdata.bit_depths[n].bits,
					label: bitdephtdata.bit_depths[n].name
				});
				
				if(bitdephtdata.bit_depths[n].bits == parseInt(self.config.get('main_stream_bit_depth')))
				{
					uiconf.sections[0].content[2].value.value = bitdephtdata.bit_depths[n].bits;
					uiconf.sections[0].content[2].value.label = bitdephtdata.bit_depths[n].name;
				}
			}
			uiconf.sections[0].content[3].value = self.config.get('main_stream_channels');
			for (var n = 0; n < codecdata.codecs.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[4].options', {
					value: codecdata.codecs[n].extension,
					label: codecdata.codecs[n].name
				});
				
				if(codecdata.codecs[n].extension == self.config.get('main_stream_codec'))
				{
					uiconf.sections[0].content[4].value.value = codecdata.codecs[n].extension;
					uiconf.sections[0].content[4].value.label = codecdata.codecs[n].name;
				}
			}
			
			// Secondary stream
			uiconf.sections[0].content[5].value = self.config.get('enable_secondary_stream');
			uiconf.sections[0].content[6].value = self.config.get('secondary_stream_name');
			for (var n = 0; n < ratesdata.sample_rates.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[7].options', {
					value: ratesdata.sample_rates[n].rate,
					label: ratesdata.sample_rates[n].name
				});
				
				if(ratesdata.sample_rates[n].rate == parseInt(self.config.get('secondary_stream_sample_rate')))
				{
					uiconf.sections[0].content[7].value.value = ratesdata.sample_rates[n].rate;
					uiconf.sections[0].content[7].value.label = ratesdata.sample_rates[n].name;
				}
			}
			for (var n = 0; n < bitdephtdata.bit_depths.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[8].options', {
					value: bitdephtdata.bit_depths[n].bits,
					label: bitdephtdata.bit_depths[n].name
				});
				
				if(bitdephtdata.bit_depths[n].bits == parseInt(self.config.get('secondary_stream_bit_depth')))
				{
					uiconf.sections[0].content[8].value.value = bitdephtdata.bit_depths[n].bits;
					uiconf.sections[0].content[8].value.label = bitdephtdata.bit_depths[n].name;
				}
			}
			uiconf.sections[0].content[9].value = self.config.get('secondary_stream_channels');
			for (var n = 0; n < codecdata.codecs.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[10].options', {
					value: codecdata.codecs[n].extension,
					label: codecdata.codecs[n].name
				});
				
				if(codecdata.codecs[n].extension == self.config.get('secondary_stream_codec'))
				{
					uiconf.sections[0].content[10].value.value = codecdata.codecs[n].extension;
					uiconf.sections[0].content[10].value.label = codecdata.codecs[n].name;
				}
			}
			uiconf.sections[0].content[9].value = self.config.get('enable_debug_logging');
			self.logger.info("1/3 setting groups loaded");
			
			// Show players
			if(execSync("echo $(sed -n \"/.*type.*\"fifo\"/{n;p}\" /etc/mpd.conf | cut -d '\"' -f2)") == "no")
				uiconf.sections[1].content[0] = false;
			else
				uiconf.sections[1].content[0] = true;
			

            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

snapserver.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

snapserver.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

snapserver.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

snapserver.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

// Update Config Methods -----------------------------------------------------------------------------

snapserver.prototype.updateServerConfig = function(newConfig) {
	var self = this;
	var defer = libQ.defer();
	
	// Always update snapserver config, there's no neat if-statement possible afaik; it also doesn't break anything (worst case is a playback hiccup of a few seconds)
	
	return defer.promise;
};

snapserver.prototype.updatePlayerConfigs = function(newConfig) {
	var self = this;
	var defer = libQ.defer();
	
	if(newConfig['patch_mpd_conf'])
	{
		self.config.set('patch_mpd_conf', data['patch_mpd_conf']);
		self.config.set('mpd_sample_rate', data['mpd_sample_rate']);
		self.config.set('mpd_bit_depth', data['mpd_bit_depth']);
		self.config.set('mpd_channels', data['mpd_channels']);
		self.config.set('enable_alsa_mpd', data['enable_alsa_mpd']);
		self.config.set('enable_fifo_mpd', data['enable_fifo_mpd']);
		self.updateMpdConfig();
	}
	if(newConfig['enable_spotify_service'])
	{
		self.config.set('enable_spotify_service', data['enable_spotify_service']);
		self.updateSpotifyConfig();
	}
	if(newConfig['enable_airplay_service'])
	{
		self.config.set('enable_spotify_service', data['enable_spotify_service']);
		self.updateShairportConfig();
	}
	
	return defer.promise;
};

snapserver.prototype.updateMpdConfig = function() {
	var self = this;
	var defer = libQ.defer();
	
	self.generateMpdUpdateScript()
	.then(function(executeScript)
        {
			self.executeShellScript(__dirname + '/mpd_switch_to_fifo.sh');
			defer.resolve(execScript);
        });
	self.commandRouter.pushToastMessage('success', "Completed", "Successfully updated MPD config");
	
	return defer.promise;
};

snapserver.prototype.generateMpdUpdateScript = function()
{
	var self = this;
	var defer = libQ.defer();
	
	fs.readFile(__dirname + "/templates/mpd_switch_to_fifo.template", 'utf8', function (err, data) {
		if (err) {
			defer.reject(new Error(err));
		}

		let tmpconf = data.replace("${SAMPLE_RATE}", self.config.get('mpd_sample_rate'));
		tmpconf.replace("${BIT_DEPTH}", self.config.get('mpd_bit_depth'));
		tmpconf.replace("${CHANNELS}", self.config.get('mpd_channels'));
		tmpconf.replace(/ENABLE_ALSA/g, self.config.get('enable_alsa_mpd') == true ? "yes" : "no");
		tmpconf.replace(/ENABLE_FIFO/g, self.config.get('enable_fifo_mpd') == true ? "yes" : "no");
		
		fs.writeFile(__dirname + "/templates/mpd_switch_to_fifo.sh", tmpconf, 'utf8', function (err) {
			if (err)
			{
				self.commandRouter.pushConsoleMessage('Could not write the script with error: ' + err);
				defer.reject(new Error(err));
			}
			else 
				defer.resolve();
		});
	});
	
	return defer.promise;
};

snapserver.prototype.updateShairportConfig = function() {
	var self = this;
	
	return true;
};

snapserver.prototype.updateSpotifyConfig = function() {
	var self = this;
	var defer = libQ.defer();
	
	if(self.get.config('enable_spotify_service'))
	{
		// Spop
		self.streamEdit("alsa", "raw", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		self.streamEdit("${outdev}", "/tmp/snapfifo", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		// Legacy implementation
		self.streamEdit("--device ${outdev}", "--backend pipe --device /tmp/snapfifo ${normalvolume} \\\\", "/data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl", false);
		// New implementation > TOML
		self.streamEdit("device", "device = \\x27/tmp/snapfifo\\x27 --backend pipe", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
	}
	else
	{
		self.streamEdit("raw", "alsa", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		self.streamEdit("/tmp/snapfifo", "${outdev}", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		self.streamEdit("--backend pipe --device /tmp/snapfifo ${normalvolume} \\\\", "--device ${outdev}", "/data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl", false);
		self.streamEdit("device", "--device ${outdev} ${normalvolume}  \\", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
	}
	
	var responseData = {
	title: 'Configuration required',
	message: 'Changes have been made to the Spotify implementation template, you need to save the settings in, or restart the corresponding plugin again for the changes to take effect.',
	size: 'lg',
	buttons: [{
				name: self.commandRouter.getI18nString('COMMON.CONTINUE'),
				class: 'btn btn-info',
				emit: '',
				payload: ''
			}
		]
	}

	self.commandRouter.broadcastMessage("openModal", responseData);

	return defer.promise;
};

snapserver.prototype.patchAsoundConfig = function()
{
	var self = this;
	var defer = libQ.defer();
	
	// define the replacement dictionary
	var replacementDictionary = [
		{ placeholder: "${SAMPLE_RATE}", replacement: self.config.get('sample_rate') },
		{ placeholder: "${OUTPUT_PIPE}", replacement: self.config.get('spotify_pipe') }
	];
	
	self.createAsoundConfig(replacementDictionary)
	.then(function (copyAsoundConfig) {
		let edefer = libQ.defer();
		execSync("/usr/bin/rsync --ignore-missing-args /etc/asound.conf "+ __dirname +"/templates/asound.conf", {uid:1000, gid:1000}, function (error, stout, stderr) {
			if(error)
			{
				self.logger.error('Could not copy config file to temp location with error: ' + error);
				defer.reject(new Error(error));
			}
		});
		edefer.resolve();
	})
	.then(function (touchFile) {
		let edefer = libQ.defer();
		exec("/bin/touch "+ __dirname +"/templates/asound.conf", {uid:1000, gid:1000}, function (error, stout, stderr) {
			if(error)
			{
				console.log(stderr);
				self.logger.error('Could not touch config with error: ' + error);
				self.commandRouter.pushToastMessage('error', "Configuration failed", "Failed to touch asound configuration file with error: " + error);
				edefer.reject(new Error(error));
			}
		});
		edefer.resolve();
	})
	.then(function (clear_current_asound_config) {
		let edefer = libQ.defer();
		let pluginName = __dirname.split('/').slice(-1).toUpperCase();
		exec("/bin/sed -i -- '/#" + pluginName + "/,/#ENDOF" + pluginName + "/d' "+ __dirname +"/templates/asound.conf", {uid:1000, gid:1000}, function (error, stout, stderr) {
			if(error)
			{
				console.log(stderr);
				self.logger.error('Could not clear config with error: ' + error);
				self.commandRouter.pushToastMessage('error', "Configuration failed", "Failed to update asound configuration with error: " + error);
				edefer.reject(new Error(error));
			}
		});
		edefer.resolve();
	})
	.then(function (copy_new_config) {
		let edefer = libQ.defer();
		// needs alsactl -L -R restore
		var cmd = "/bin/cat " + __dirname + "/templates/asound.section >> "+ __dirname +"/templates/asound.conf";
		fs.writeFile(__dirname + "/" + __dirname.split('/').slice(-1) + "_asound_patch.sh", cmd, 'utf8', function (err) {
			if (err)
			{
				self.commandRouter.pushConsoleMessage('Could not write the script with error: ' + err);
				edefer.reject(new Error(err));
			}
		});
		edefer.resolve();
	})
	.then(function (placeFilesBack) {
		exec("/usr/bin/sudo /bin/systemctl restart snap-activator", {uid:1000, gid:1000}, function (error, stout, stderr) {
			if(error)
			{
				self.logger.error('Could not replace /etc/asound.conf with error: ' + error);
				defer.reject(new Error(error));
			}
		});
		
		defer.resolve(placeFiles);
	});
	
	self.commandRouter.pushToastMessage('success', "Successful push", "Successfully pushed new ALSA configuration");
	return defer.promise;
};

snapserver.prototype.createAsoundConfig = function(replacements)
{
	var self = this;
	var defer = libQ.defer();
	
	fs.readFile(__dirname + "/templates/asound." + __dirname.split('/').slice(-1), 'utf8', function (err, data) {
		if (err) {
			defer.reject(new Error(err));
		}

		var tmpConf = data;
		for (var rep in replacements)
		{
			tmpConf = tmpConf.replace(replacements[rep]["placeholder"], replacements[rep]["replacement"]);			
		}
			
		fs.writeFile(__dirname + "/templates/asound.section", tmpConf, 'utf8', function (err) {
				if (err)
				{
					self.commandRouter.pushConsoleMessage('Could not write the script with error: ' + err);
					defer.reject(new Error(err));
				}
				else 
					defer.resolve();
		});
	});
	
	return defer.promise;
};

// General functions ---------------------------------------------------------------------------------

snapserver.prototype.executeShellScript = function (scriptName)
{
	var self = this;
	var defer = libQ.defer();

	var command = "/bin/sh " + scriptName;	
	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
		{
			console.log(stderr);
			self.commandRouter.pushConsoleMessage('Could not execute script {' + scriptName + '} with error: ' + error);
		}

		self.commandRouter.pushConsoleMessage('Successfully executed script {' + scriptName + '}');
		defer.resolve();
	});

	
	return defer.promise;
};

snapserver.prototype.streamEdit = function (pattern, value, inFile, append)
{
	var self = this;
	var defer = libQ.defer();
	let castValue;
	
	if(value == true || value == false)
			castValue = ~~value;
	else
		castValue = value;

	let command = "/bin/sed -i -- '/" + pattern + ".*/a " + castValue + "' " + inFile;
	if(!append)
		command = "/bin/sed -i -- 's|" + pattern + ".*|" + castValue + "|g' " + inFile;	

	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
			console.log(stderr);

		defer.resolve();
	});
	
	return defer.promise;
};

snapserver.prototype.isValidJSON = function (str) 
{
	var self = this;
    try 
	{
        JSON.parse(JSON.stringify(str));
    } 
	catch (e) 
	{
		self.logger.error('Could not parse JSON, error: ' + e + '\nMalformed JSON msg: ' + JSON.stringify(str));
        return false;
    }
    return true;
};