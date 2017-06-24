import React, { Component } from 'react';
import { FormGroup, Label, Input, Button, Form, Table } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelBrowserParameters from './ModelBrowserParameters'
import TooltipIcon from '../common/TooltipIcon'


class ModelBrowserActions extends Component {

    render() {
        const {_id, name, type, optional, infos, pkg, cls, profiles, profileParameters, selectedProfile, updateProfile, updateProfileForChildren, updateEditable, updateEditableForChildren, updateProfileParameter, isFlattenInheritance, t} = this.props;

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
                          <span className={ `align-self-center ${profiles.indexOf(selectedProfile) > -1 && 'font-weight-bold'} ${!editable && 'text-muted'}` }><span className="font-italic">{ name }</span>
                          { profiles.indexOf(selectedProfile) === -1 ? t('isNotIncluded') : t('isIncluded') }
                          </span>
                      </Toggle> }
                    { isPackage &&
                      <Toggle name="editableSelf"
                          checked={ editable }
                          onToggle={ e => updateEditable(this.props) }
                          size="2x">
                          <span className="align-self-center"><span className="font-italic">{ name }</span>
                          { editable ? t('editable') : t('notEditable') }
                          </span>
                      </Toggle> }
                </FormGroup>
                { (isPackage || isClass) &&
                  <div className="font-weight-bold">
                      { t('inclusionActions') }
                  </div> }
                { isPackage &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('addDirectMandatory') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, true, false) }>
                              { t('apply') }
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('addDirectAll') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, false) }>
                              { t('apply') }
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('addAllMandatory') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, true, true) }>
                              { t('apply') }
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('addAllAll') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, true) }>
                              { t('apply') }
                          </Button>
                      </div>
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('addAll') }</span>
                          { isFlattenInheritance && editable && (infos.supertypes || infos.subtypes) &&
                            <TooltipIcon id={ `${_id}-add-warning` }
                                placement="right"
                                className="ml-1"
                                icon="warning"
                                color="warning">
                                { t('actionAffectOther') }
                            </TooltipIcon> }
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, true, false, isFlattenInheritance) }>
                              { t('apply') }
                          </Button>
                      </div>
                  </div> }
                { (isPackage || isClass) &&
                  <div className="font-weight-bold py-1">
                      { t('exclusionActions') }
                  </div> }
                { isPackage &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('removeDirect') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, false, false) }>
                              { t('apply') }
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('removeAll') }</span>
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, false, true) }>
                              { t('apply') }
                          </Button>
                      </div>
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span className={ !editable && 'text-muted' }>{ t('removeOptional') }</span>
                          { isFlattenInheritance && editable && (infos.supertypes || infos.subtypes) &&
                            <TooltipIcon id={ `${_id}-remove-warning` }
                                placement="right"
                                className="ml-1"
                                icon="warning"
                                color="warning">
                                { t('actionAffectOther') }
                            </TooltipIcon> }
                          <Button size="sm"
                              color="primary"
                              className="ml-auto mt-auto"
                              disabled={ !editable }
                              onClick={ e => updateProfileForChildren(this.props, false, true, isFlattenInheritance) }>
                              { t('apply') }
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
