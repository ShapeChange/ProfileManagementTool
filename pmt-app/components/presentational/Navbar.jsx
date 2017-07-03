import React, { Component } from 'react';
import { Navbar as BSNavbar, NavbarBrand, Container, Button, Badge, Popover, PopoverTitle, PopoverContent, ListGroup, ListGroupItem } from 'reactstrap';
import { Link } from 'redux-little-router';
import FontAwesome from 'react-fontawesome';
import TooltipIcon from '../common/TooltipIcon'


class Navbar extends Component {

    toggleMenu = (e) => {
        const {toggleMenu} = this.props;

        toggleMenu();

        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
        }
    }

    render() {
        const {isMenuOpen, isErrorsOpen, toggleMenu, toggleErrors, model, profile, busy, baseUrls, user, t} = this.props;

        return (
            <BSNavbar color="inverse"
                inverse
                fixed="top"
                className="flex-row">
                { user ? <Button color="info" onClick={ this.toggleMenu } className={ 'menu-button' + (isMenuOpen ? ' active' : '') }>
                             <FontAwesome name="bars" />
                         </Button> : <Button color="info" className={ 'menu-button hidden' }>
                                         <FontAwesome name="bars" />
                                     </Button> }
                <NavbarBrand tag="span">
                    PMT
                </NavbarBrand>
                { model && <div className="navbar-text px-3">
                               <FontAwesome name="sitemap" className="pr-2" />
                               <span>{ model.name }</span>
                           </div> }
                { model && profile && <div className="navbar-text px-3">
                                          <FontAwesome name="id-card" className="pr-2" />
                                          <span>{ model.profilesInfo[profile].name }</span>
                                          { model.profilesInfo[profile].description && <TooltipIcon id={ `${profile}-description` }
                                                                                           className="ml-2"
                                                                                           placement="bottom"
                                                                                           icon="info-circle">
                                                                                           { model.profilesInfo[profile].description }
                                                                                       </TooltipIcon> }
                                      </div> }
                { model && profile && <div className="navbar-text ml-auto">
                                          { busy ? <FontAwesome name="spinner" pulse />
                                            : model.profilesInfo[profile].errors.length > 0
                                            ? <div>
                                                  <Link id="errors"
                                                      href={ '' }
                                                      title={ t('showErrors') }
                                                      onClick={ (e) => {
                                                                    e.preventDefault();
                                                                    toggleErrors();
                                                                } }>
                                                  <Badge color="danger" className="rounded-circle">
                                                      { model.profilesInfo[profile].errors.length }
                                                  </Badge>
                                                  </Link>
                                                  <Popover placement="bottom right"
                                                      isOpen={ isErrorsOpen }
                                                      target="errors"
                                                      toggle={ toggleErrors }
                                                      tether={ { constraints: [{ to: 'scrollParent', attachment: 'together', pin: true }] } }>
                                                      <PopoverTitle>
                                                          { t('errors') }
                                                      </PopoverTitle>
                                                      <PopoverContent className="p-0" style={ { overflowY: 'auto', maxHeight: '400px' } }>
                                                          <ListGroup className="border-0 rounded-0">
                                                              { model.profilesInfo[profile].errors.map((err, i) => <ListGroupItem key={ err.itemId } className={ `rounded-0 border-left-0 border-right-0 border-bottom-0 ${i === 0 && 'border-top-0'}` }>
                                                                                                                       <Link href={ `${baseUrls['cls']}/${err.itemId}` } title={ err.name } className="text-danger">
                                                                                                                       { t('validation:consistencyError', err) }
                                                                                                                       <br/>
                                                                                                                       { t('validation:' + err.msg, err) }
                                                                                                                       </Link>
                                                                                                                   </ListGroupItem>
                                                                ) }
                                                          </ListGroup>
                                                      </PopoverContent>
                                                  </Popover>
                                              </div>
                                            : <FontAwesome name="check" className="text-success" /> }
                                      </div> }
            </BSNavbar>
        );
    }
}
;

export default Navbar
