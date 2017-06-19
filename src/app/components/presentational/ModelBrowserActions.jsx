import React, { Component } from 'react';
import { FormGroup, Label, Input, Button, Form, Table } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelBrowserParameters from './ModelBrowserParameters'
import Warning from '../common/Warning'


class ModelBrowserActions extends Component {

    render() {
        const {_id, name, type, optional, infos, pkg, cls, profiles, profileParameters, selectedProfile, updateProfile, updateProfileForChildren, updateEditable, updateEditableForChildren, updateProfileParameter, isFlattenInheritance} = this.props;

        const isPackage = type === 'pkg'
        const isClass = type === 'cls'
        const isProperty = type === 'prp'
        const editable = pkg && pkg.editable

        return (
            <div>
                <FormGroup tag="fieldset">
                    { (isClass || isProperty) &&
                      <Toggle name="includeSelf"
                          checked={ profiles.indexOf(selectedProfile) > -1 }
                          disabled={ !editable || (type === 'prp' && cls.profiles.indexOf(selectedProfile) === -1) || (type === 'prp' && !optional) }
                          onToggle={ e => updateProfile(this.props) }
                          size="2x">
                          <span className={ `align-self-center ${profiles.indexOf(selectedProfile) > -1 && 'font-weight-bold'} ${!editable && 'text-muted'}` }><span className="font-italic">{ name }</span> is
                          { profiles.indexOf(selectedProfile) === -1 && ' not ' } included in profile</span>
                      </Toggle> }
                    { isPackage &&
                      <Toggle name="editableSelf"
                          checked={ editable }
                          onToggle={ e => updateEditable(this.props) }
                          size="2x">
                          <span className="align-self-center"><span className="font-italic">{ name }</span> is
                          { !editable && ' not ' } editable</span>
                      </Toggle> }
                </FormGroup>
                { (isPackage || isClass) &&
                  <div className="font-weight-bold">
                      Inclusion Actions
                  </div> }
                { isPackage &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Add direct child classes with mandatory properties to profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, true, false) }>
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Add direct child classes with all properties to profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, false) }>
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Add all classes in subpackages with mandatory properties to profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, true, true) }>
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Add all classes in subpackages with all properties to profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, true) }>
                              Apply
                          </Button>
                      </div>
                      { /*<div className="d-flex py-1">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <span>Mark all subpackages as editable</span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Button size="sm"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                color="primary"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                className="ml-auto mt-auto"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                onClick={ e => updateEditableForChildren(this.props, true) }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                Apply
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </Button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>*/ }
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Add all properties to profile</span>
                          { isFlattenInheritance && editable && (infos.supertypes || infos.subtypes) &&
                            <Warning id={ `${_id}-add-warning` } placement="right" className="ml-1">
                                Applying this action will affect other classes
                            </Warning> }
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, isFlattenInheritance) }>
                              Apply
                          </Button>
                      </div>
                  </div> }
                { (isPackage || isClass) &&
                  <div className="font-weight-bold py-1">
                      Exclusion Actions
                  </div> }
                { isPackage &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Remove direct child classes with all properties from profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, false, false) }>
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Remove all classes in subpackages with all properties from profile</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, false, true) }>
                              Apply
                          </Button>
                      </div>
                      { /*<div className="d-flex py-1">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <span>Mark all subpackages as non-editable</span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <Button size="sm"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                color="primary"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                className="ml-auto mt-auto"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                onClick={ e => updateEditableForChildren(this.props, false) }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                Apply
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </Button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>*/ }
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>Remove optional properties from profile</span>
                          { isFlattenInheritance && editable && (infos.supertypes || infos.subtypes) &&
                            <Warning id={ `${_id}-remove-warning` } placement="right" className="ml-1">
                                Applying this action will affect other classes
                            </Warning> }
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, true, isFlattenInheritance) }>
                              Apply
                          </Button>
                      </div>
                  </div> }
                { ((isClass && infos && infos.stereotypes === 'featuretype') || isProperty) &&
                  <ModelBrowserParameters {...this.props}
                      isClass={ isClass }
                      isProperty={ isProperty }
                      disabled={ !editable || (type === 'prp' && cls.profiles.indexOf(selectedProfile) === -1) } /> }
            </div>
        );
    }
}
;

export default ModelBrowserActions
