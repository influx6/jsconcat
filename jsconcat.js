var JsConcat = (function(fs,path,uglify){

var  _uglify = uglify.uglify;
var  _parser = uglify.parser;

var  _isType = function(o,type){
	return Object.prototype.toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase() === type;
};


var getPath = function(p){
   return fs.readFileSync(p,'utf8');
};

var _normalize_string = function(s){
	return s.replace(/\s/g,"");
};

var _normalize_path = function(dir,root){
        dir =  _normalize_string(dir);
        if(!root){
        	return path.normalize(path.resolve(dir));
        }
        return path.normalize(path.resolve(root,dir));
};

var initBuildDir = function(dir){
  var p = _normalize_path(dir);
  if(fs.existsSync(p)){
        return true;
  }else{
    fs.mkdir(p);
  }
  
};


var _getRequireConfig = function(config){
    if(typeof config.src_dir != 'string' && typeof config.build_dir != 'string'){
	throw new Error("Src_Dir and Build_dir are not strings!");
    }
	var config = config;
	initBuildDir(config.build_dir);
	return config;
};

var each = function(obj,callback,scope){
    var attr;
	    
	    if(_isType(obj,"array") ||  _isType(obj,"string")){
	    	for(var i = 0; i < obj.length; i ++){
	    		callback.call(scope,obj[i],obj,i);
	    	}
	    }
	    else {
	    	for(attr in obj){
	    		callback.call(scope, attr,obj);
	    	}
	    };	    
	     
};

var _getStream = function(o,read,options){
	if(!read){
		return fs.createWriteStream(o,options)
	}
	else{
	 	return fs.createReadStream(o,options);
	 }
};


var _use_uglify = function(code,build){
	var ast,gen;
	try{
		ast = _parser.parse(code);
		ast = _uglify.ast_mangle(ast);
		ast = _uglify.ast_squeeze(ast,{no_warnings: false});
		ast = _uglify.ast_squeeze_more(ast);
		gen = _uglify.gen_code(ast);
		return  gen;
	}catch(e){
		e.message = "Error: " + e.message+ " at line: "+ e.line + " in file: "+build;
		throw e.message;
 	}
};

var _compileConfig = function(config,build){
	var config = _getRequireConfig(config);
	var src_dir = _normalize_path(config.src_dir);
    var dump="",input;
    	
    each(config.src, function(o,obj){
	   input = path.join(src_dir,o);
       var data =  getData(input);
	   _use_uglify(data,o);
	   dump += data;
    });
    
	if(config.uglify){
		_compressConfig(dump,build,config.name);
	}else{
    	fs.writeFileSync(build,dump);
	}
}

var getData = function(file){
	return fs.readFileSync(file,'utf8').toString();
};

var removefile = function(file){
	fs.unlink(file);
};

var _compressConfig = function(data,build,file){
	if(typeof data == 'string'){
		var uglified = _use_uglify(data,file);
		fs.writeFileSync(build,uglified,'utf8');
	}
}

var compile = function(config){
	
	var build_dir = _normalize_path(config.build_dir);
	var build_file = path.join(build_dir,config.name);
	 
	var status = fs.existsSync(build_file);

	if(status){ removefile(build_file); }
	
	_compileConfig(config,build_file);
};


return { compile: compile }

})(require('fs'),require('path'),require('uglify-js'));

module.exports.JsConcat = JsConcat;


