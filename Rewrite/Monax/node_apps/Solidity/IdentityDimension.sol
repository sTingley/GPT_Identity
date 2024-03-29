/*
This contract represents a single 'IDENTITY DIMENSION' as defined in the TCS DI Protocol
It will never be called directly but instead by a IdentityDimensionControl contract
The IdentityDimensionControl contract is set as the 'chairperson' inside this contract's storage

For a complete picture of the how identity dimensions are created refer to the excel doc
Functional-Process-Spec-IdentityDimensions*/

pragma solidity ^0.4.4;
contract IdentityDimension {

    //the chairperson will ALWAYS be the user's current IdentityDimensionControl contract
    bytes32 chairperson;

    //A DIMENSION CAN BE REFERRED TO BE ANY OF THE TWO:
    bytes32 ID; //This is the Identity Dimension ID
    bytes32 dimensionType; //The use case of the identity dimension. For example, "Financial History".

    //attributes are stored in 3 pieces as the length of IPFS URLs are greater than 32 bytes
    struct attributes {
        bytes32 attribute;
        bytes32 attribute2;
        bytes32 attribute3;
    }

    /*NOTE:
        The way this is coded is if something exists in the public mapping,
        its descriptor must exist in the publicDescriptor array. The analagous
        holds for the private mapping and the privateDescriptor array.*/

    //the following are hash tables: key is descriptor; value is attribute (IPFS URL or bigchain trxn ID)
    mapping(bytes32 => attributes) publicAttributes;
    mapping(bytes32 => attributes) privateAttributes;

    //the following keeps track of the descriptors that are public and private
    bytes32[] publicDescriptors;
    bytes32[] privateDescriptors;

    uint nonce;//for random number generation

    modifier accessCheck(address caller) {
        if(sha3(caller) != chairperson) {
            throw;
        }
        _;
    }

    /***********************************************************************************************
    Constructor — input information at instantiation
    INPUT: uniqueID (unhashed), dimensionType (ex. "My Music Playlist"), flag = (0,1) = (pub,priv)
    ***********************************************************************************************/

    function IdentityDimension(bytes32 uniqueID, bytes32 theDimensionType, uint flag) {
        
        //make the chairperson the deployer of this contract, by this line in the constructor:
        chairperson = sha3(msg.sender);

        //instantiate vars:
        nonce = 0;

        ID = sha3(uniqueID,theDimensionType,getRand(1,1000));
        dimensionType = theDimensionType;

        //this is the descriptor of the first entry
        //it is the hex encoding of the string "Owner"
        //using the hex encoder: http://www.convertstring.com/EncodeDecode/HexEncode
        //bytes32 theDescriptor = 0x4F776E6572;

        //this.addEntry(theDescriptor,sha3(uniqueID),"0x0","0x0",flag);
    }

    function changeChairperson() accessCheck(msg.sender) returns (bytes32) {
        chairperson = sha3(msg.sender);
        return chairperson;
    }

    //creates an attribute/descriptor and puts it in the appropriate array, determined by the flag (flag = 0 => public; flag = 1 => private). NOT for updates
    function addEntry(bytes32 descriptor, bytes32 attribute, bytes32 attribute2, bytes32 attribute3, uint flag) accessCheck(msg.sender) returns (bool success) {
        success = false;

        //public
        if (flag == 0) {
        //if attribute is blank
            if (publicAttributes[descriptor].attribute == 0x0) {
                //add to the mapping
                publicAttributes[descriptor] = attributes(attribute,attribute2,attribute3);
                success = true;
                //add to the array
                addPublicDescriptor(descriptor);

            }
        } else { //private

            if (privateAttributes[descriptor].attribute == 0x0) {
                //add to the mapping
                privateAttributes[descriptor] = attributes(attribute,attribute2,attribute3);
                success = true;
                //add to the array
                addPrivateDescriptor(descriptor);
            }
        }
    }

    //removes an entry
    //entry must exist to be removed
    function removeEntry(bytes32 descriptor) accessCheck(msg.sender) returns (bool success) {
        success = false;

        if (publicAttributes[descriptor].attribute != 0x0) {
            //remove from the mapping
            publicAttributes[descriptor] = attributes(0x0,0x0,0x0);
            success = true;
            //remove from the array
            removePublicDescriptor(descriptor);

        } else {
            if (privateAttributes[descriptor].attribute != 0x0) {
                //remove from the mapping
                privateAttributes[descriptor] = attributes(0x0,0x0,0x0);
                success = true;
                //remove from the array
                removePrivateDescriptor(descriptor);
            }
        }
    }

    /*Gives you an attribute for a given descriptor.
    return success = false if not found*/
    function readEntry(bytes32 descriptor) accessCheck(msg.sender) returns (bytes32 value,bytes32 value2,bytes32 value3, bool success, bool isPublic) {

        isPublic = true;
        success = true;
        value = 0x0;
        attributes pub = publicAttributes[descriptor];
        attributes priv = privateAttributes[descriptor];

        if (pub.attribute != 0x0) {
            //it's public
            value = pub.attribute;
            value2 = pub.attribute2;
            value3 = pub.attribute3;
            //no need to change isPublic (since by default is true)
            //no need to change success (since by default is true)

        } else {
            if (priv.attribute != 0x0) {
                //it's private
                value = priv.attribute;
                value2 = priv.attribute2;
                value3 = priv.attribute3;
                isPublic = false;
                //no need to change success (since by default is true)

            } else {
                //not found
                success = false;
            }
        }
    }

    //change a descriptor value for a given attribute
    function changeDescriptor(bytes32 oldDescriptor, bytes32 newDescriptor) accessCheck(msg.sender) returns (bool success) {
        attributes pub = publicAttributes[oldDescriptor];
        attributes priv = privateAttributes[oldDescriptor];

        success = (pub.attribute != 0x0 || priv.attribute != 0x0);
        if (success) {
            if (pub.attribute != 0x0) {
                //update mapping
                publicAttributes[oldDescriptor] = attributes(0x0,0x0,0x0);
                publicAttributes[newDescriptor] = attributes(pub.attribute, pub.attribute2, pub.attribute3);
                //update arrays
                removePublicDescriptor(oldDescriptor);
                addPublicDescriptor(newDescriptor);

            } else {
                //update mapping
                privateAttributes[oldDescriptor] = attributes(0x0,0x0,0x0);
                privateAttributes[newDescriptor] = attributes(priv.attribute, priv.attribute2, priv.attribute3);
                //update arrays
                removePrivateDescriptor(oldDescriptor);
                addPrivateDescriptor(newDescriptor);
            }
        }
    }


    /*This function is to update entries.
    IMPORTANT: THIS FUNCTION IS NOT INTENDED TO BE CALLED AS A DELETE!
    In calling this function, if someone doesn't want to change the flag, put flag = 2.
    In calling this function, if someone doesn't want to change the attribute, you can put the attribute as an empty bytes32.*/
    function update(bytes32 descriptor,bytes32 attribute,bytes32 attribute2,bytes32 attribute3, uint flag) accessCheck(msg.sender) returns (bool success) {
        bytes32 value;
        bytes32 value2;
        bytes32 value3;
        bool entryExists;
        bool isPublic;

        (value, value2, value3, entryExists, isPublic) = readEntry(descriptor);
        
        delete value;
        //delete value2;
        //delete value3;


        success = entryExists;

        if (success) {
            //find the correct flag for removing and then adding the entry
            if (flag == 2) {

                if(isPublic) {
                    flag = 0;
                } else {
                    flag = 1;
                }
            }

            //find the correct attribute for removing and then adding the entry
            if (attribute == 0x0) {

               // attribute = value;//value is current value of the attribute for the descriptor
            } else { //else keep it as it is

                //remove the entry then add it
                success = removeEntry(descriptor) && addEntry(descriptor,attribute,attribute2,attribute3,flag);
                }
        }

    }

    //tellls you if a descriptor is public
    function isPublic(bytes32 descriptor) returns (bool result) {
        result = (publicAttributes[descriptor].attribute != 0x0);
    }

    //tells you if a descriptor is private
    function isPrivate(bytes32 descriptor) returns (bool result) {
        result = (privateAttributes[descriptor].attribute != 0x0);
    }

    //returns the first 100 public descriptors, delimiter is a comma
    function getPublicDescriptors() returns (bytes32[100] list) {
        /*NOTE: the function is formatted the way it is because publicDescriptors can have
        some holes (ex. 3rd entry null, 4th entry with value) ... because of the way the
        delete strategy works for this contract*/

        uint arrayCounter = 0;

        for(uint i = 0; i < list.length; i++) {
            if(arrayCounter < publicDescriptors.length) {
                bytes32 currentVal = publicDescriptors[arrayCounter];

                if(currentVal == 0x0) {
                    i = i - 1; //to leave no holes in list (decrease it because it will be increased)

                } else {
                    list[i] = currentVal;
                }

                arrayCounter++;
            }
        }
    }


    //returns the first 100 private descriptors, delimiter is a comma
    function getPrivateDescriptors() returns (bytes32[100] list) {
        /*NOTE: the function is formatted the way it is because privateDescriptors can have
        some holes (ex. 3rd entry null, 4th entry with value) ... because of the way the
        delete strategy works for this contract*/

        uint arrayCounter = 0;

        for (uint i = 0; i < list.length; i++) {
            if (arrayCounter < privateDescriptors.length) {
                bytes32 currentVal = privateDescriptors[arrayCounter];

                if (currentVal == 0x0) {
                    i = i - 1; //to leave no holes in list (decrease it because it will be increased)
                } else {
                    list[i] = currentVal;
                }

                arrayCounter++;
            }
        }
    }

    //gives you the dimension ID storage value
    function getID() accessCheck(msg.sender) returns (bytes32 theID) {
        theID = ID;
    }

    //gives you the dimension name storage value
    function getName() accessCheck(msg.sender) returns (bytes32 theName) {
        theName = dimensionType;
    }


    /***********************************************************************************************
        THE REST OF THIS SCRIPT ARE ARRAY HELPER FUNCTIONS
        THE PUBLIC/PRIVATE DESCRIPTOR COUNTS ARE MANAGED ONLY BY THESE FUNCTIONS
            note the use of the function modifier 'internal'
    ***********************************************************************************************/
     
    //helper function, gives you a random integer in the closed interval [min,max]
    function getRand(uint min, uint max) internal returns (uint val) {
        nonce++;
        val = uint(sha3(nonce))%(min+max)-min;
    }
    
    /*helper function called by addEntry-
    adds a descriptor to the public descriptor array
    ASSUMES that the descriptor is new to the array*/
    function addPublicDescriptor(bytes32 descriptor) internal {

        if (publicDescriptors.length == 0) {
            publicDescriptors.push(descriptor);

        } else {
            //find FIRST empty index of array
            uint indexOfEmpty = 0;
            bool emptyFound = false;

            for (uint i = 0; i < publicDescriptors.length; i++) {
                if (emptyFound == false) {
                    if (publicDescriptors[i] == 0x0) {
                        emptyFound = true;
                        indexOfEmpty = i;
                    }
                }
            }

            if (emptyFound) {
                publicDescriptors[indexOfEmpty] = descriptor;

            } else {
                publicDescriptors.push(descriptor);
            }
        }

    }



    /*helper function called by addEntry-
    adds a descriptor to the private descriptor array
    ASSUMES that the descriptor is new to the array*/
    function addPrivateDescriptor(bytes32 descriptor) internal {

        if (privateDescriptors.length == 0) {
            privateDescriptors.push(descriptor);

        } else {
            //find FIRST empty index of array
            uint indexOfEmpty = 0;
            bool emptyFound = false;

            for (uint i = 0; i < privateDescriptors.length; i++) {
                if (emptyFound == false) {
                    if (privateDescriptors[i] == 0x0) {
                        emptyFound = true;
                        indexOfEmpty = i;
                    }
                }
            }

            if (emptyFound) {
                privateDescriptors[indexOfEmpty] = descriptor;
            } else {
                privateDescriptors.push(descriptor);
            }
        }

    }

    /*helper function called by removeEntry-
    ASSUMES a given descriptor is in the publicArray, sets it empty
    given the way the functions are called, there will never be double entries
    in the publicDescriptor array*/
    function removePublicDescriptor(bytes32 descriptor) internal {
        for (uint i = 0; i < publicDescriptors.length;i++) {
            if (publicDescriptors[i] == descriptor) {
                publicDescriptors[i] = 0x0;
            }
        }
    }

    /*helper function called by removeEntry-
    ASSUMES a descriptor is in the privateArray, sets it empty
    given the way the functions are called, there will never be double entries
    in the privateDescriptor array*/
    function removePrivateDescriptor(bytes32 descriptor) internal {
        for (uint i = 0; i < privateDescriptors.length;i++) {
            if (privateDescriptors[i] == descriptor) {
                privateDescriptors[i] = 0x0;
            }
        }
    }

    //kills the contract
    function kill() accessCheck(msg.sender) {
        suicide(this);
    }

 }