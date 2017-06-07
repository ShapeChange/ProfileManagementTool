import React, { Component } from 'react';
import { Table, Input, Label, Form, FormGroup } from 'reactstrap';


class ModelBrowserParameters extends Component {

    _parseMultiplicity = () => {
        const {isProperty, infos, profileParameters, selectedProfile} = this.props;

        let multiplicity = {
            min: 0,
            max: 0,
            minValue: 0,
            maxValue: 0,
            maxUnbounded: false,
            maxValueUnbounded: false
        }

        if (isProperty && infos && infos.cardinality) {
            let bounds = infos.cardinality.split('..')
            multiplicity.min = multiplicity.minValue = parseInt(bounds[0])
            multiplicity.max = multiplicity.maxValue = parseInt(bounds[1])
            multiplicity.maxUnbounded = multiplicity.maxValueUnbounded = bounds[1] === '*'

            if (profileParameters[selectedProfile] && profileParameters[selectedProfile].multiplicity) {
                console.log(profileParameters[selectedProfile].multiplicity)
                bounds = profileParameters[selectedProfile].multiplicity.split('..')
                multiplicity.minValue = parseInt(bounds[0])
                multiplicity.maxValue = parseInt(bounds[1])
                multiplicity.maxValueUnbounded = bounds[1] === '*'
            }
        }
        console.log(multiplicity);

        return multiplicity
    }

    _writeMultiplicity = (multiplicity) => {

        return `${multiplicity.minValue}..${multiplicity.maxValueUnbounded ? '*' : multiplicity.maxValue}`
    }

    _updateMinCardinality = (e) => {
        const multiplicity = this._parseMultiplicity();

        multiplicity.minValue = e.target.value

        this._updateCardinality(this._writeMultiplicity(multiplicity))
    }

    _updateMaxCardinality = (e) => {
        const multiplicity = this._parseMultiplicity();

        if (e.target.type === 'checkbox' && e.target.checked)
            multiplicity.maxValueUnbounded = true;
        else if (e.target.type === 'checkbox' && !e.target.checked) {
            multiplicity.maxValueUnbounded = false;
            multiplicity.maxValue = multiplicity.minValue + 1;
        }
        else
            multiplicity.maxValue = e.target.value;

        this._updateCardinality(this._writeMultiplicity(multiplicity))
    }

    _updateCardinality = (multiplicity) => {
        const {updateProfileParameter} = this.props;

        updateProfileParameter(this.props, 'multiplicity', multiplicity)
    }

    render() {
        const {isClass, isProperty, infos, profileParameters, selectedProfile} = this.props;

        const multiplicity = this._parseMultiplicity();

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Parameter
                </div>
                <Table size="sm" reflow>
                    <tbody>
                        { isClass && infos && infos.stereotypes === 'featuretype' &&
                          <tr>
                              <td className="pl-0 pr-3 border-0">
                                  <span className="align-self-center">geometry</span>
                              </td>
                              <td className="pl-0 border-0 py-0" style={ { width: '100%' } }>
                                  <Input type="select"
                                      name="selectMulti"
                                      multiple
                                      size="sm"
                                      style={ { width: '75px', height: '150px' } }
                                      defaultValue={ ['P', 'C', 'S', 'So', 'MP', 'MC', 'MS', 'MSo'] }
                                      value={ profileParameters[selectedProfile] && profileParameters[selectedProfile].geometry }
                                      onChange={ e => updateProfileParameter(this.props, 'geometry', [...e.target.selectedOptions].map(o => o.value)) }>
                                  { ['P', 'C', 'S', 'So', 'MP', 'MC', 'MS', 'MSo'].map(g => <option key={ g }>
                                                                                                { g }
                                                                                            </option>) }
                                  </Input>
                              </td>
                          </tr> }
                        { isProperty && infos && infos.isAttribute === 'false' &&
                          <tr>
                              <td className="pl-0 pr-3 border-0">
                                  <span className="align-self-center">isNavigable</span>
                              </td>
                              <td className="pl-0 border-0 py-0">
                                  <span className=""><Toggle name="isNavigable" checked={ profileParameters[selectedProfile] && profileParameters[selectedProfile].isNavigable === 'true' } onToggle={ e => updateProfileParameter(this.props, 'isNavigable', profileParameters[selectedProfile] && profileParameters[selectedProfile].isNavigable === 'true' ? 'false' : 'true') }> </Toggle></span>
                              </td>
                          </tr> }
                        { isProperty &&
                          <tr>
                              <td className="pl-0 pr-3 border-0">
                                  cardinality
                              </td>
                              <td className="pl-0 border-0" style={ { width: '100%' } }>
                                  <Form inline>
                                      <FormGroup>
                                          <Input type="number"
                                              size='sm'
                                              name="minOccurs"
                                              style={ { width: '75px' } }
                                              value={ multiplicity.minValue }
                                              min={ multiplicity.min }
                                              max={ multiplicity.maxValue }
                                              onChange={ this._updateMinCardinality } />
                                          <span className="px-1">..</span>
                                          <Input type="number"
                                              size='sm'
                                              name="maxOccurs"
                                              style={ { width: '75px' } }
                                              value={ multiplicity.maxValue }
                                              min={ multiplicity.minValue }
                                              max={ multiplicity.max }
                                              disabled={ multiplicity.maxValueUnbounded }
                                              onChange={ this._updateMaxCardinality } />
                                          { ' ' }
                                          <FormGroup check className="pl-3">
                                              <Label check>
                                                  <Input type="checkbox"
                                                      checked={ multiplicity.maxValueUnbounded }
                                                      disabled={ !multiplicity.maxUnbounded }
                                                      onChange={ this._updateMaxCardinality } /> *
                                              </Label>
                                          </FormGroup>
                                      </FormGroup>
                                  </Form>
                                  { /* profileParameters[selectedProfile] ? profileParameters[selectedProfile].multiplicity : infos.cardinality */ }
                              </td>
                          </tr> }
                    </tbody>
                </Table>
            </div>
        );
    }
}
;

export default ModelBrowserParameters
