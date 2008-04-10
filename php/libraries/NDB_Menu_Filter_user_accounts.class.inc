<?php
require_once 'NDB_Menu_Filter.class.inc';

/**
 * The menu for user accounts
 * @package main
 */
class NDB_Menu_Filter_user_accounts extends NDB_Menu_Filter
{
    function _hasAccess()
    {
        // create user object
        $user =& User::singleton();
        if(PEAR::isError($user)) {
            return PEAR::raiseError("User Error: ".$user->getMessage());
        }

        return $user->hasPermission('user_accounts');
    }

    function _setupVariables()
    {
        $user =& User::singleton();
        if(PEAR::isError($user)) {
            return PEAR::raiseError("User Error: ".$user->getMessage());
        }

        // the base query
        $query = " FROM users, psc WHERE users.CenterID = psc.CenterID ";
        if (!$user->hasPermission('user_accounts_multisite')) {
            $query .= " AND users.CenterID = '" . $user->getData('CenterID') . "' ";
        }

        // set the class variables
        $this->columns = array('Name AS PSC', 'UserID AS Username', 'Real_name AS Full_name', 'Email', 'Active', 'Examiner', 'Pending_approval');
        $this->query = $query;
        $this->order_by = 'Username';
        $this->validFilters = array('users.CenterID', 'users.UserID', 'users.Real_name', 'users.Email', 'users.Active', 'users.Examiner', 'users.Pending_approval');

        $this->formToFilter = array(
                                    'centerID' => 'users.CenterID',
                                    'active' => 'users.Active',
                                    'examiner' => 'users.Examiner',
                                    'userID' => 'users.UserID',
                                    'real_name' => 'users.Real_name',
                                    'email' => 'users.Email',
                                    'pending' => 'users.Pending_approval'
                                    );
        return true;
    }


    function _setFilterForm()
    {
    	// create user object
        $user =& User::singleton();
        if(PEAR::isError($user)) {
            return PEAR::raiseError("User Error: ".$user->getMessage());
        }

        // PSC
        if ($user->hasPermission('user_accounts_multisite')) {
            // get the list of study sites - to be replaced by the Site object
            $list_of_sites =& Utility::getSiteList(false);
            if(PEAR::isError($list_of_sites)) {
                return PEAR::raiseError("DB Error: ".$list_of_sites->getMessage());
            }
            if(is_array($list_of_sites)) $list_of_sites = array('' => 'Any') + $list_of_sites;
        }
        else {
            // allow only to view own site data
            $site =& Site::singleton($user->getData('CenterID'));
            if (PEAR::isError($site)) {
                return PEAR::raiseError("Unable to construct the list_of_sites array: ".$site->getMessage());
            }
            $list_of_sites = array($user->getData('CenterID') => $user->getData('Site'));
        }

        // add form elements
        $this->form->addElement('select', 'centerID', 'Site:', $list_of_sites);
        $this->form->addElement('select', 'active', 'Active:', array('' => 'Any', 'Y' => 'Y', 'N' => 'N'));
        $this->form->addElement('select', 'examiner', 'Examiner:', array('' => 'Any', 'Y' => 'Y', 'N' => 'N'));
        $this->form->addElement('text', 'userID', 'Username:');
        $this->form->addElement('text', 'real_name', 'Full name:');
        $this->form->addElement('text', 'email', 'Email:');
        $this->form->addElement('select', 'pending', 'Pending Approval:', array(''=>'Any', '0'=>'N', '1'=>'Y'));

        return true;
    }
}
?>