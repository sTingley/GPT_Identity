class AssetTags {

	constructor(pubKey, assetID){
		this.storage = "";
		this.pubKey = pubKey;
		this.assetID = assetID;
		if(typeof localStorage !== "undefined"){
			this.storage = localStorage;	
			this.init();
		} else
			console.warn("localStorage not found! Please use latest browser");
	}
	
	init(){
		if(!this.storage.getItem(this.pubKey)){
			var defaultVal = {};
			defaultVal[this.assetID] = {"classes":[],"subclasses":[]};
			this.storage.setItem(this.pubKey, JSON.stringify(defaultVal));
		} else {
			var dta = this.getData();
			if(!dta[this.assetID]){
				dta[this.assetID] = {"classes":[],"subclasses":[]};
				this.storage.setItem(this.pubKey, JSON.stringify(dta));
			}
		}
	}
	
	updateClasses(tags, assetID, type){
		var data = this.getData();
		data[assetID][type] = tags;
		this.setData(data);
	}
	
	setData(data){
		this.storage.setItem(this.pubKey, JSON.stringify(data));
	}
	
	getData(){
		return JSON.parse(this.storage.getItem(this.pubKey));
	}
	
	getAssetData(type){
		return this.getData()[this.assetID][type];
	}
}
export default AssetTags;