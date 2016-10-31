var myCallback = function(err, data) {
  if (err) throw err; // Check for the error and throw if it exists.
  console.log('got data: '+data); // Otherwise proceed as usual.
};

var usingItNow = function(callback) {
  callback(null, 'get it?'); // I dont want to throw an error, so I pass null for the error argument
};

usingItNow(myCallback)




function myFunction(hi,callback)
{
	setTimeout(function(){
		callback(hi);
		},9000)
}

myFunction(3,function(result)
{
	console.log(result)
})
