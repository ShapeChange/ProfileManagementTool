import React, { Component } from 'react';
import { FormGroup, Label, Input, Button } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'


class ModelBrowserActions extends Component {

    constructor(props) {
        super(props);
        this.state = {
            checked: {}
        };
    }

    _toggle = (e) => {
        const name = e.currentTarget.name

        this.setState({
            checked: {
                ...this.state.checked,
                [name]: !this.state.checked[name]
            }
        });
    }

    render() {
        const {_id, name, type, profiles, selectedProfile, updateProfile} = this.props;

        const isPackage = type === 'pkg'
        const isClass = type === 'cls'
        const isProperty = type === 'prp'

        return (
            <div>
                <FormGroup tag="fieldset">
                    { isClass &&
                      <Toggle name="includeSelf"
                          checked={ profiles.indexOf(selectedProfile) > -1 }
                          onToggle={ e => updateProfile(this.props) }
                          size="2x">
                          <span className={ 'align-self-center' + (profiles.indexOf(selectedProfile) > -1 ? ' font-weight-bold' : '') }><span className="font-italic">{ name }</span> is included in profile</span>
                      </Toggle> }
                    { isPackage &&
                      <Toggle name="editableSelf"
                          checked={ this.state.checked.editableSelf || false }
                          onToggle={ this._toggle }
                          size="2x">
                          <span className="align-self-center"><span className="font-italic">{ name }</span> is editable</span>
                      </Toggle> }
                    { /*<Toggle name="includeDirectMandatory" checked={ this.state.checked.includeDirectMandatory || false } onToggle={ this._toggle }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Include direct child classes with mandatory properties in profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </Toggle>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Toggle name="includeDirectAll" checked={ this.state.checked.includeDirectAll || false } onToggle={ this._toggle }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Include direct child classes with all properties in profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </Toggle>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Toggle name="includeAllMandatory" checked={ this.state.checked.includeAllMandatory || false } onToggle={ this._toggle }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Include all classes in subpackages with mandatory properties in profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </Toggle>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Toggle name="includeAllAll" checked={ this.state.checked.includeAllAll || false } onToggle={ this._toggle }>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Include all classes in subpackages with all properties in profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </Toggle>*/ }
                </FormGroup>
                { (isPackage || isClass) &&
                  <div className="font-weight-bold">
                      Inclusion Actions
                  </div> }
                { isPackage &&
                  <div>
                      <div className="d-flex py-1">
                          <span>Add direct child classes with mandatory properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Add direct child classes with all properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Add all classes in subpackages with mandatory properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Add all classes in subpackages with all properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Mark all subpackages as editable</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span>Add mandatory properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Add all properties to profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
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
                          <span>Remove direct child classes with all properties from profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Remove all classes in subpackages with all properties from profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Mark all subpackages as non-editable</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                  </div> }
                { isClass &&
                  <div>
                      <div className="d-flex py-1">
                          <span>Remove optional properties from profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                      <div className="d-flex py-1">
                          <span>Remove all properties from profile</span>
                          <Button size="sm" color="primary" className="ml-auto mt-auto">
                              Apply
                          </Button>
                      </div>
                  </div> }
            </div>
        );
    }
}
;

export default ModelBrowserActions
