<?

/*
assign_missing_instruments.php compares the currently assigned battery with the
expected battery at a particular timepoint for all candidates.

It has two modes:
regular mode -> Prints the instruments found missing, but does not acutally add them to the battery.
confirm mode -> Actually assigns the instruments found missing in the database.

Usage: php assign_missing_instrument.php [Visit_label] [confirm]
Example: php assign_missing_instrument.php 18month          (Will use regular mode and print the missing instruments)
Example: php assign_missing_instrument.php 18month confirm          (Will use confirm mode and assign the missing instruments)


Note:  As per ... only timepoints in the 'Visit' stage are examined.

Note: This tool will NOT remove instruments that do exist in the
assigned battery but have been removed from the battery lookup table (or
set to Active=N).  This behavior is intended, instruments should NEVER be removed.  Ever.
*/


//get a list of all the candidates
//foreach candidate we need to look at each timepoint
//compare the looked up battery to the actual assigned battery
//add missing instruments.


require_once "../php/libraries/NDB_Client.class.inc";
$client = new NDB_Client();
$client->makeCommandLine();
$client->initialize();

$DB =& Database::singleton();
$query="SELECT ID, subprojectID from session";
if(!empty($argv[1]) && $argv[1]!="confirm"){
	$query.=" WHERE visit_label='$argv[1]'";
}
$DB->select($query, $results);
foreach($results AS $result){
		// create a new battery object && new battery
        $battery =& new NDB_BVL_Battery;

        // select a specific time point (sessionID) for the battery
        $battery->selectBattery($result['ID']);
        $timePoint =& TimePoint::singleton($result['ID']);
        
        //To assign missing instruments to all sessions, sent to DCC or not.
        $defined_battery=$battery->lookupBattery($battery->age, $result['subprojectID'], $timePoint->getCurrentStage());
        $actual_battery=$battery->getBattery($timePoint->getCurrentStage());
        
      //To assign missing instruments only for sessions in the Visit stage...
//        $defined_battery=$battery->lookupBattery($battery->age, $result['subprojectID'], 'Visit');
//        $actual_battery=$battery->getBattery('Visit');
        
        $diff=array_diff($defined_battery, $actual_battery);
        if(!empty($diff)){
	        echo "\n CandID: ".$timePoint->getCandID()."  Visit Label:  ".$timePoint->getVisitLabel()."\nMissing Instruments:\n";
	        print_r($diff);
        }
        if($argv[1]=="confirm" || $argv[2]=="confirm"){
	        foreach($diff AS $test_name){
	        	$battery->addInstrument($test_name);
	        }
        }
        
        unset($battery);
        unset($timePoint);
}
if($argv[1]!="confirm" && $argv[2]!="confirm"){
	echo "\n\nRun this tool again with the argument 'confirm' to perform the changes\n\n";
}
?>